# Flujo de trabajo editorial eficiente

## Regla principal
El Director Editorial es el único orquestador. No se ejecutan todos los especialistas por defecto: primero clasifica la obra y crea un plan. Cada especialista recibe solo el contexto mínimo necesario.

## Pipeline
1. **Ingreso**: texto pegado, archivo o dictado.
2. **Normalización local**: extracción, limpieza, idioma, conteo y división por capítulos sin IA.
3. **Director**: genera un `brief` estructurado y un plan de trabajo JSON.
4. **Trabajos paralelos**: corrección, crítica, voz/estilo, reescritura, mercado/KDP y arte solo cuando aporten valor.
5. **Memoria comprimida**: cada agente devuelve `resultado + hallazgos + cambios + score + resumen <= 1200 caracteres`.
6. **QA editorial**: el Director compara resultados con el brief y decide aprobar, reparar o repetir. Máximo 2 reintentos por tarea.
7. **Paquete final**: manuscrito, informe editorial, sinopsis, metadata, keywords/categorías, prompts de cubierta/interiores y archivos de exportación.

## Ahorro de tokens
- Contexto por capítulos y ventanas, nunca repetir el libro completo.
- Cachear perfiles, briefs y análisis por hash de contenido.
- Usar modelos económicos para clasificación/QA y modelos fuertes solo para reescritura final.
- Pedir JSON compacto entre agentes; renderizar explicaciones largas solo para el usuario.
- Autosave con debounce y hash para no crear versiones idénticas.
- Reintentos solo si falla un criterio objetivo de calidad.

## Contrato de calidad
Cada tarea debe incluir criterios de aceptación, score 0-100 y defectos concretos. El Director no entrega un paquete como terminado por debajo de 90/100; si es reparable, delega la reparación y vuelve a validar.

## UX
El usuario puede hablar directamente con el Director en un chat. El Director puede explicar, rehacer o sustituir cualquier entregable. La interfaz no bloquea el trabajo esperando preguntas: usa valores por defecto razonables y declara las decisiones tomadas.
