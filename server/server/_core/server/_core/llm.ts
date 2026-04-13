import OpenAI from "openai";

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StreamOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function* streamLLM(
  prompt: string,
  options: StreamOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = "gpt-3.5-turbo",
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "Eres un asistente editorial experto en análisis literario.",
        },
        { role: "user", content: prompt },
      ],
      stream: true,
      temperature,
      max_tokens: maxTokens,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error("Error en streamLLM:", error);
    throw new Error("Falló la generación de texto con IA");
  }
}

// Función helper para análisis de agentes
export async function analyzeWithAgent(
  documentContent: string,
  agentType: "director" | "voice_analyst" | "critic"
): Promise<string> {
  const prompts = {
    director: `Analiza este texto como director editorial. Evalúa:
- Estructura narrativa (inicio, nudo, desenlace)
- Ritmo y pacing
- Coherencia de la trama
- Desarrollo de personajes

Texto a analizar:
${documentContent}`,

    voice_analyst: `Analiza la voz y el estilo de este texto:
- Tono predominante
- Estilo narrativo
- Consistencia de la voz del autor
- Uso del lenguaje

Texto a analizar:
${documentContent}`,

    critic: `Haz una crítica literaria profesional:
- Calidad de la prosa
- Originalidad
- Elementos estilísticos destacables
- Áreas de mejora

Texto a analizar:
${documentContent}`,
  };

  let fullResponse = "";
  for await (const chunk of streamLLM(prompts[agentType])) {
    fullResponse += chunk;
  }

  return fullResponse;
}
