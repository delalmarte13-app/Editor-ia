import express from "express";
import { z } from "zod";
import { streamLLM } from "./llm";

const router = express.Router();

// Schema de validación
const agentStreamSchema = z.object({
  projectId: z.string().uuid(),
  documentId: z.string().uuid(),
  agentType: z.enum(["director", "voice_analyst", "critic"]),
  prompt: z.string().optional(),
});

// Endpoint para streaming de agentes
router.post("/api/stream/agent", async (req, res) => {
  try {
    const validatedData = agentStreamSchema.parse(req.body);
    
    // Configurar headers para SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Importante para nginx

    // Simular streaming (aquí iría la llamada real a OpenAI/Anthropic)
    const mockResponse = `Analizando documento...
    
Puntos clave detectados:
- Estructura narrativa coherente
- Voz del autor consistente
- Ritmo adecuado

Recomendaciones:
1. Fortalecer el conflicto en el acto 2
2. Profundizar en el desarrollo del personaje secundario
3. Considerar ajustar el tono en las transiciones`;

    // Enviar chunks simulados
    const chunks = mockResponse.split(" ");
    for (const chunk of chunks) {
      const data = ` ${JSON.stringify({
        type: "delta",
        content: chunk + " ",
      })}\n\n`;
      
      res.write(data);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay
    }

    // Enviar señal de fin
    res.write(` data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error("Error en stream agent:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Datos inválidos", details: error.errors });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
});

export default router;
