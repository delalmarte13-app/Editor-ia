import { mockDb, TEST_USER } from "./server/_core/test-server";
import { invokeLLM } from "./server/_core/llm";
import { AGENT_PROMPTS } from "./server/agents/prompts";

interface AgentTest {
  name: string;
  agentType: string;
  status: "✅ PASS" | "❌ FAIL";
  message: string;
  response?: string;
  error?: string;
}

const tests: AgentTest[] = [];

async function testAgent(
  name: string,
  agentType: string,
  storyContent: string
) {
  try {
    console.log(`\n🤖 Testing ${name}...`);
    
    const prompt = (AGENT_PROMPTS as any)[agentType]?.replace("{text}", storyContent);
    if (!prompt) {
      throw new Error(`No prompt found for agent type: ${agentType}`);
    }

    console.log(`   📝 Prompt length: ${prompt.length} characters`);
    console.log(`   ⏳ Invoking LLM...`);

    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });

    const response = result.choices[0].message.content;
    if (typeof response !== "string" || response.length === 0) {
      throw new Error("Empty response from LLM");
    }

    console.log(`   ✅ Response received: ${response.substring(0, 100)}...`);
    console.log(`   📊 Response length: ${response.length} characters`);

    tests.push({
      name,
      agentType,
      status: "✅ PASS",
      message: "Agent analysis completed successfully",
      response: response.substring(0, 200),
    });
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    tests.push({
      name,
      agentType,
      status: "❌ FAIL",
      message: "Agent analysis failed",
      error: error.message,
    });
  }
}

async function runAgentTests() {
  console.log("🚀 Starting AI Agents Streaming Tests\n");
  console.log("📚 Story: La Feria Mágica de los Sueños\n");

  // Setup mock data
  await mockDb.upsertUser({
    openId: TEST_USER.openId,
    name: TEST_USER.name,
    email: TEST_USER.email,
  });

  // Create project and document
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

  const project = await mockDb.createProject(TEST_USER.id, {
    title: "La Feria Mágica de los Sueños",
    genre: "Infantil Fantástico",
    description: "Una historia sobre una feria infantil donde los juegos cobran vida mágica",
  });

  await mockDb.createDocumentVersion({
    projectId: project.id,
    userId: TEST_USER.id,
    content: storyContent,
    wordCount: storyContent.split(/\s+/).length,
    charCount: storyContent.length,
    versionLabel: "v1 - Initial Draft",
  });

  console.log(`✅ Project created: "${project.title}"`);
  console.log(`✅ Document saved: ${storyContent.split(/\s+/).length} words\n`);

  // Test each agent
  console.log("🧪 Testing Editorial Agents\n");
  console.log("=".repeat(70));

  await testAgent(
    "Director Editorial",
    "director",
    storyContent
  );

  await testAgent(
    "Analista de Voz",
    "voice_analyst",
    storyContent
  );

  await testAgent(
    "Crítico Literario",
    "critic",
    storyContent
  );

  // Print results
  console.log("\n" + "=".repeat(70));
  console.log("📋 AGENT TEST RESULTS");
  console.log("=".repeat(70) + "\n");

  tests.forEach((test) => {
    console.log(`${test.status} ${test.name} (${test.agentType})`);
    console.log(`   ${test.message}`);
    if (test.response) {
      console.log(`   Preview: "${test.response.substring(0, 80)}..."`);
    }
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  const passed = tests.filter((t) => t.status === "✅ PASS").length;
  const failed = tests.filter((t) => t.status === "❌ FAIL").length;

  console.log("\n" + "=".repeat(70));
  console.log(`📊 Agent Tests: ${passed} passed, ${failed} failed out of ${tests.length}`);
  console.log("=".repeat(70) + "\n");

  if (failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runAgentTests().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
