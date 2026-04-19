// Mock LLM for testing without external API calls
import type { InvokeParams, InvokeResult } from "./llm";

export async function invokeLLMMock(params: InvokeParams): Promise<InvokeResult> {
  // Simulate LLM response based on the prompt content
  const userMessage = params.messages.find(m => m.role === "user");
  const prompt = typeof userMessage?.content === "string" ? userMessage.content : "";

  let response = "";

  if (prompt.includes("Director Editorial")) {
    response = `# Análisis del Director Editorial

## Estructura Narrativa
La historia "La Feria Mágica de los Sueños" presenta una estructura bien definida con una introducción clara, cinco actos principales (cada uno representado por una atracción de la feria), y un epílogo satisfactorio.

## Elementos Positivos
1. **Propósito Educativo Claro**: Cada atracción de la feria transmite una lección valiosa para los niños
2. **Narrativa Envolvente**: El concepto de la feria mágica captura la imaginación
3. **Lenguaje Accesible**: El texto es apropiado para la audiencia infantil
4. **Conclusión Significativa**: El final refuerza que las lecciones perduran más allá del sueño

## Recomendaciones de Mejora
1. Expandir las descripciones de los personajes secundarios
2. Incluir más diálogos entre los niños
3. Desarrollar más los sentimientos emocionales de los protagonistas
4. Considerar agregar un giro inesperado en el tercer acto

## Calificación General
Excelente potencial para publicación. La historia combina entretenimiento con educación de manera efectiva.`;
  } else if (prompt.includes("Analista de Voz")) {
    response = `# Análisis de Voz y Tono

## Características del Tono
- **Mágico y Envolvente**: El texto crea una atmósfera de magia y misterio
- **Cálido y Reconfortante**: La voz narrativa transmite seguridad a los lectores
- **Educativo sin ser Moralizante**: Las lecciones se integran naturalmente en la narrativa

## Consistencia de Voz
El tono se mantiene consistente a lo largo de toda la historia, adaptándose apropiadamente a cada sección.

## Adecuación para la Audiencia
La voz es perfectamente apropiada para niños de 6-12 años, con un lenguaje que es accesible pero no condescendiente.

## Elementos Lingüísticos Destacados
- Uso efectivo de la personificación (los juegos cobran vida)
- Metáforas significativas que refuerzan las lecciones
- Ritmo narrativo que mantiene el interés

## Sugerencias de Mejora
1. Variar más la estructura de las oraciones
2. Incluir más diálogos directos
3. Usar más adjetivos sensoriales para enriquecer las descripciones`;
  } else if (prompt.includes("Crítico Literario")) {
    response = `# Crítica Literaria Profesional

## Análisis Temático
"La Feria Mágica de los Sueños" explora temas universales de crecimiento personal, autoaceptación y resiliencia a través de la metáfora de una feria mágica.

## Calidad de la Prosa
La prosa es clara y elegante, con un buen balance entre descripción y narrativa. El uso de la magia como elemento literario es efectivo sin ser excesivo.

## Desarrollo de Personajes
Aunque los personajes principales son los niños, la historia no profundiza mucho en sus características individuales. Esto podría ser una oportunidad para futuras expansiones.

## Impacto Emocional
La historia genera una conexión emocional significativa con el lector, especialmente en el epílogo donde se revela que las lecciones son reales.

## Comparación con Obras Similares
Esta obra se compara favorablemente con clásicos de la literatura infantil como "El Mago de Oz" en su estructura de viaje transformador.

## Veredicto Final
Una obra de literatura infantil de calidad superior que merece ser publicada y ampliamente distribuida. Recomendación: Publicar con mínimas revisiones.`;
  } else {
    response = "Análisis completado. Esta es una respuesta de prueba del sistema de agentes.";
  }

  return {
    id: `mock-${Date.now()}`,
    created: Date.now(),
    model: "gemini-2.5-flash-mock",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: response,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: Math.floor(prompt.length / 4),
      completion_tokens: Math.floor(response.length / 4),
      total_tokens: Math.floor((prompt.length + response.length) / 4),
    },
  };
}
