# Editorial Gems

Este directorio contiene los perfiles de las Gems especializadas que pueden trabajar como departamentos de la editorial.

## Arquitectura

`Editor-ia` es el orquestador. Las Gems son motores especializados, no el sistema de memoria, caché ni ejecución.

Departamentos iniciales:

1. `director.md` — dirección y decisiones editoriales.
2. `narrativa.md` — creación y desarrollo literario por secciones.
3. `editor.md` — edición estructural y de estilo.
4. `continuidad.md` — Story Bible y control de canon.
5. `arte.md` — dirección artística y prompts visuales.
6. `produccion-kdp.md` — producción, metadatos y publicación.

## Regla de integración

Cada Gem debe recibir únicamente el contexto relevante de la tarea. La memoria persistente, el historial de tareas, la caché, los reintentos y el control QA pertenecen a `Editor-ia`.

La producción narrativa usa unidades pequeñas: capítulo, escena, sección, página o doble página según el formato. Una unidad se revisa y aprueba antes de avanzar.
