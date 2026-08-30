# Editorial Core

Pipeline determinista previo a IA:

`normalize -> segment -> memory -> plan`

`pipeline.ts` compone estas etapas. El objetivo es que ninguna llamada LLM reciba el manuscrito completo por defecto.

## Reglas

- Procesamiento determinista primero.
- Hash/cache antes de regenerar.
- Contexto mínimo suficiente.
- QA antes de entregar.
- Reparación acotada.
