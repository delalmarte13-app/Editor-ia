import { mockDb, TEST_USER } from "./server/_core/test-server";

interface ApiTest {
  name: string;
  status: "✅ PASS" | "❌ FAIL";
  message: string;
  error?: string;
  details?: any;
}

const tests: ApiTest[] = [];

async function apiTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    tests.push({ name, status: "✅ PASS", message: "Test passed" });
  } catch (error: any) {
    tests.push({
      name,
      status: "❌ FAIL",
      message: error.message || "Test failed",
      error: error.response?.data || error.message,
    });
  }
}

async function runFullFlow() {
  console.log("🚀 Starting Full Application Flow Test\n");
  console.log("📚 Story: La Feria Mágica de los Sueños\n");

  // Setup mock data
  await mockDb.upsertUser({
    openId: TEST_USER.openId,
    name: TEST_USER.name,
    email: TEST_USER.email,
  });

  // Create project and document
  let projectId: number;
  let storyContent = `# La Feria Mágica de los Sueños

En las afueras del pueblo de San Cristóbal, cada primer viernes de mes, aparecía una feria movil como por arte de magia. Sus tiendas de lona de colores brillantes, sus luces parpadeantes y su música alegre atraían a niños de toda la región.

## El Carrusel de las Emociones

El primer juego era un carrusel de caballos de madera pintados con colores imposibles. Cuando los niños subían, cada caballo susurraba sus miedos más profundos, pero en lugar de asustarlos, les enseñaba que todos tenemos miedo, y eso está bien. El carrusel giraba mientras una voz suave explicaba que el coraje no es la ausencia de miedo, sino seguir adelante a pesar de él.

## La Casa de los Espejos del Autoconocimiento

La segunda atracción era una casa de espejos, pero estos no deformaban la imagen. En su lugar, mostraban al niño cómo lo veían sus amigos, sus padres, y lo más importante, cómo se veía a sí mismo. Algunos niños descubrían que eran más fuertes de lo que creían, otros que tenían talentos escondidos. Cada espejo era una lección sobre la aceptación y el amor propio.

## La Montaña Rusa de la Resiliencia

La tercera atracción era una pequeña montaña rusa que no bajaba tan rápido como parecía. Durante el recorrido, los niños enfrentaban pequeños obstáculos que debían superar con ingenio. Al final, descubrían que cada "caída" era en realidad una oportunidad para aprender a levantarse. La lección: la vida tiene altibajos, pero siempre podemos aprender de ellos.

## El Juego de Anillos de la Generosidad

En el cuarto puesto, había un juego de anillos tradicional, pero con una diferencia mágica. Cada anillo que un niño lanzaba exitosamente se convertía en un regalo que podía dar a otro niño. Los ganadores más grandes eran aquellos que compartían sus premios. La feria les enseñaba que la verdadera victoria es hacer feliz a otros.

## La Rueda de la Fortuna de las Oportunidades

La última atracción era una rueda de la fortuna especial. Cada sección contenía no un premio material, sino una oportunidad: "Aprenderás a cocinar", "Descubrirás un nuevo hobby", "Harás un nuevo amigo". Los niños comprendían que la vida está llena de oportunidades inesperadas, y la verdadera magia es estar abierto a ellas.

## El Secreto de la Feria

Cuando la feria se desvanecía al anochecer, los niños se daban cuenta de que no había sido un sueño. Llevaban consigo las lecciones de cada juego, tatuadas en sus corazones. La feria mágica volvería el próximo mes, pero sus enseñanzas permanecerían para siempre.`;

  const project = await mockDb.createProject(TEST_USER.id, {
    title: "La Feria Mágica de los Sueños",
    genre: "Infantil Fantástico",
    description: "Una historia sobre una feria infantil donde los juegos cobran vida mágica",
  });
  projectId = project.id;

  const version = await mockDb.createDocumentVersion({
    projectId,
    userId: TEST_USER.id,
    content: storyContent,
    wordCount: storyContent.split(/\s+/).length,
    charCount: storyContent.length,
    versionLabel: "v1 - Initial Draft",
  });

  console.log(`✅ Project created: ID ${projectId}`);
  console.log(`✅ Document version created: ID ${version.id}`);
  console.log(`📊 Story length: ${storyContent.split(/\s+/).length} words\n`);

  // Test data retrieval
  console.log("🧪 Testing Data Retrieval\n");

  await apiTest("Retrieve Project", async () => {
    const project = await mockDb.getProjectById(projectId, TEST_USER.id);
    if (!project || project.title !== "La Feria Mágica de los Sueños") {
      throw new Error("Project not found or title mismatch");
    }
    console.log(`   Project: ${project.title}`);
  });

  await apiTest("Retrieve Latest Document", async () => {
    const doc = await mockDb.getLatestDocumentVersion(projectId, TEST_USER.id);
    if (!doc || !doc.content) {
      throw new Error("Document not found");
    }
    console.log(`   Document length: ${doc.content.length} characters`);
  });

  await apiTest("List All Projects", async () => {
    const projects = await mockDb.getProjectsByUserId(TEST_USER.id);
    if (projects.length === 0) {
      throw new Error("No projects found");
    }
    console.log(`   Found ${projects.length} project(s)`);
  });

  await apiTest("Get Document Versions", async () => {
    const versions = await mockDb.getDocumentVersionsByProjectId(projectId);
    if (versions.length === 0) {
      throw new Error("No versions found");
    }
    console.log(`   Found ${versions.length} version(s)`);
  });

  // Print results
  console.log("\n" + "=".repeat(70));
  console.log("📋 FLOW TEST RESULTS");
  console.log("=".repeat(70) + "\n");

  tests.forEach((test) => {
    console.log(`${test.status} ${test.name}`);
    console.log(`   ${test.message}`);
    if (test.error) {
      console.log(`   Details: ${JSON.stringify(test.error).substring(0, 100)}`);
    }
  });

  const passed = tests.filter((t) => t.status === "✅ PASS").length;
  const failed = tests.filter((t) => t.status === "❌ FAIL").length;

  console.log("\n" + "=".repeat(70));
  console.log(`📊 Flow Tests: ${passed} passed, ${failed} failed out of ${tests.length}`);
  console.log("=".repeat(70) + "\n");

  if (failed > 0) {
    process.exit(1);
  }
}

// Run the test
runFullFlow().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
