import { useState, useEffect, useRef } from "react";

export interface StreamMessage {
  type: "delta" | "complete" | "error";
  content?: string;
  error?: string;
}

export function useAgentStream(apiUrl: string) {
  const [data, setData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = async (payload: any) => {
    // Cancelar stream anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setData("");
    setError(null);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Error en la respuesta del servidor");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Aquí parseamos el stream SSE
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "");
            if (jsonStr === "[DONE]") {
              setIsLoading(false);
              return;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.content) {
                setData((prev) => prev + parsed.content);
              }
            } catch (e) {
              // Ignorar errores de parseo parcial
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
        setIsLoading(false);
      }
    }
  };

  return { data, isLoading, error, startStream };
}
