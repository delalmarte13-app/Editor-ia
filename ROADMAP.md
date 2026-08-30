# EditorialAI Roadmap

## Principio
Construir una plataforma editorial que planifique, ejecute, compruebe y mejore trabajos especializados con el menor contexto y coste posible.

## Flujo
Arquitectura -> tarea -> implementación -> pruebas -> QA -> CI -> integración.

## P0 Núcleo
- P0-DOM-001 Modelo de dominio.
- P0-NORM-001 Normalización.
- P0-SEG-001 Segmentación.
- P0-MEM-001 Memoria editorial compacta.
- P0-DIR-001 Director y planificador.
- P0-RUN-001 Runner de tareas y dependencias.
- P0-QA-001 Puerta de calidad.
- P0-TEST-001 Suite de regresión.

Criterio: un manuscrito se convierte en una producción estructurada con QA sin reprocesar contexto innecesario.

## P1 Persistencia e interfaz
- Proyectos, versiones, runs, tareas, resultados, memoria y conversaciones.
- Editor, progreso, chat del Director, comparación y descargas.

## P2 Ingesta y producción
- DOCX, PDF, audio y dictado.
- Agentes: corrección, voz, narrativa, crítica, mercado, KDP y arte.

## P3 Entrega
- DOCX, EPUB, PDF y ZIP.

## Definition of Done
- Implementado.
- Tipado y validado.
- Pruebas de éxito y error.
- QA independiente.
- Build/CI correcto.
- Documentado.
- Integrado en main.
