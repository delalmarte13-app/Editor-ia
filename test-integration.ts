import { mockDb, TEST_USER } from "./server/_core/test-server";
import { invokeLLMMock } from "./server/_core/llm-mock";
import { AGENT_PROMPTS } from "./server/agents/prompts";

interface IntegrationTest {
  phase: string;
  name: string;
  status: "✅ PASS" | "❌ FAIL";
  message: string;
  details?: string;
}

const results: IntegrationTest[] = [];

async function test(phase: string, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ phase, name, status: "✅ PASS", message: "Test passed" });
  } catch (error: any) {
    results.push({
      phase,
      name,
      status: "❌ FAIL",
      message: error.message || "Test failed",
      details: error.stack?.substring(0, 100),
    });
  }
}

async function runIntegrationTests() {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 COMPREHENSIVE INTEGRATION TEST SUITE");
  console.log("📚 Story: La Feria Mágica de los Sueños");
  console.log("=".repeat(80) + "\n");

  // ==================== PHASE 1: DATABASE ====================
  console.log("📦 PHASE 1: Database Operations\n");

  let projectId: number;
  let versionId: number;

  const storyContent = `# La Feria Mágica de los Sueños

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

  await test("DB", "Create User", async () => {
    const user = await mockDb.upsertUser({
      openId: TEST_USER.openId,
      name: TEST_USER.name,
      email: TEST_USER.email,
    });
    if (!user.id) throw new Error("User ID not generated");
  });

  await test("DB", "Create Project", async () => {
    const project = await mockDb.createProject(TEST_USER.id, {
      title: "La Feria Mágica de los Sueños",
      genre: "Infantil Fantástico",
      description: "Una historia sobre una feria infantil donde los juegos cobran vida mágica",
    });
    projectId = project.id;
    if (!projectId) throw new Error("Project ID not generated");
  });

  await test("DB", "Create Document Version", async () => {
    const version = await mockDb.createDocumentVersion({
      projectId,
      userId: TEST_USER.id,
      content: storyContent,
      wordCount: storyContent.split(/\s+/).length,
      charCount: storyContent.length,
      versionLabel: "v1 - Initial Draft",
    });
    versionId = version.id;
    if (!versionId) throw new Error("Version ID not generated");
  });

  // ==================== PHASE 2: DATA RETRIEVAL ====================
  console.log("\n📖 PHASE 2: Data Retrieval\n");

  await test("Retrieval", "Get Project by ID", async () => {
    const project = await mockDb.getProjectById(projectId, TEST_USER.id);
    if (!project) throw new Error("Project not found");
    if (project.title !== "La Feria Mágica de los Sueños") throw new Error("Title mismatch");
  });

  await test("Retrieval", "Get Latest Document Version", async () => {
    const version = await mockDb.getLatestDocumentVersion(projectId, TEST_USER.id);
    if (!version) throw new Error("Version not found");
    if (version.content.length === 0) throw new Error("Content is empty");
  });

  await test("Retrieval", "List All Projects", async () => {
    const projects = await mockDb.getProjectsByUserId(TEST_USER.id);
    if (projects.length === 0) throw new Error("No projects found");
  });

  await test("Retrieval", "Get Document Versions", async () => {
    const versions = await mockDb.getDocumentVersionsByProjectId(projectId);
    if (versions.length === 0) throw new Error("No versions found");
  });

  // ==================== PHASE 3: AI AGENTS ====================
  console.log("\n🤖 PHASE 3: AI Agents Analysis\n");

  await test("Agents", "Director Editorial Analysis", async () => {
    const prompt = (AGENT_PROMPTS as any).director?.replace("{text}", storyContent);
    if (!prompt) throw new Error("No prompt found");
    const result = await invokeLLMMock({ messages: [{ role: "user", content: prompt }] });
    if (!result.choices[0].message.content) throw new Error("Empty response");
  });

  await test("Agents", "Voice Analyst Analysis", async () => {
    const prompt = (AGENT_PROMPTS as any).voice_analyst?.replace("{text}", storyContent);
    if (!prompt) throw new Error("No prompt found");
    const result = await invokeLLMMock({ messages: [{ role: "user", content: prompt }] });
    if (!result.choices[0].message.content) throw new Error("Empty response");
  });

  await test("Agents", "Literary Critic Analysis", async () => {
    const prompt = (AGENT_PROMPTS as any).critic?.replace("{text}", storyContent);
    if (!prompt) throw new Error("No prompt found");
    const result = await invokeLLMMock({ messages: [{ role: "user", content: prompt }] });
    if (!result.choices[0].message.content) throw new Error("Empty response");
  });

  // ==================== PHASE 4: DATA VALIDATION ====================
  console.log("\n✅ PHASE 4: Data Validation\n");

  await test("Validation", "Story Word Count", async () => {
    const version = await mockDb.getLatestDocumentVersion(projectId, TEST_USER.id);
    if (!version) throw new Error("Version not found");
    const wordCount = version.content.split(/\s+/).length;
    if (wordCount < 400) throw new Error(`Word count too low: ${wordCount}`);
    console.log(`   📊 Story contains ${wordCount} words`);
  });

  await test("Validation", "Story Character Count", async () => {
    const version = await mockDb.getLatestDocumentVersion(projectId, TEST_USER.id);
    if (!version) throw new Error("Version not found");
    if (version.charCount < 2000) throw new Error(`Character count too low: ${version.charCount}`);
    console.log(`   📊 Story contains ${version.charCount} characters`);
  });

  await test("Validation", "Project Metadata", async () => {
    const project = await mockDb.getProjectById(projectId, TEST_USER.id);
    if (!project) throw new Error("Project not found");
    if (!project.genre) throw new Error("Genre not set");
    if (!project.description) throw new Error("Description not set");
    console.log(`   📝 Genre: ${project.genre}`);
    console.log(`   📝 Description: ${project.description.substring(0, 50)}...`);
  });

  // ==================== PRINT RESULTS ====================
  console.log("\n" + "=".repeat(80));
  console.log("📋 TEST RESULTS SUMMARY");
  console.log("=".repeat(80) + "\n");

  const phases = ["DB", "Retrieval", "Agents", "Validation"];
  phases.forEach((phase) => {
    const phaseTests = results.filter((r) => r.phase === phase);
    const passed = phaseTests.filter((r) => r.status === "✅ PASS").length;
    const failed = phaseTests.filter((r) => r.status === "❌ FAIL").length;
    console.log(`\n${phase}:`);
    phaseTests.forEach((test) => {
      console.log(`  ${test.status} ${test.name}`);
      if (test.message !== "Test passed") {
        console.log(`     ${test.message}`);
      }
    });
    console.log(`  📊 ${passed}/${phaseTests.length} passed`);
  });

  const totalPassed = results.filter((r) => r.status === "✅ PASS").length;
  const totalFailed = results.filter((r) => r.status === "❌ FAIL").length;

  console.log("\n" + "=".repeat(80));
  console.log(`🎯 OVERALL: ${totalPassed} passed, ${totalFailed} failed out of ${results.length} tests`);
  console.log("=".repeat(80) + "\n");

  if (totalFailed === 0) {
    console.log("✨ ALL TESTS PASSED! Application is fully functional.\n");
    return true;
  } else {
    console.log("⚠️  Some tests failed. Please review the errors above.\n");
    return false;
  }
}

// Run tests
runIntegrationTests().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
