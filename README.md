# EditorialAI — Estudio editorial asistido por IA

Aplicación React + Express + tRPC + PostgreSQL para convertir un manuscrito en un paquete editorial y comercializable.

## Qué ya existe
- Proyectos y versiones de documentos.
- Editor con autosave.
- Agentes editoriales: dirección, crítica, corrección, reescritura, estilo, arte, mercado y KDP.
- Exportación PDF/EPUB y arquitectura para otros formatos.
- Integraciones de IA y audio en el backend.

## Flujo de producción
El flujo oficial está en `WORKFLOW.md` y prioriza ahorro de tokens:

1. Entrada por texto, archivo o voz.
2. Normalización y segmentación local.
3. Director Editorial crea un brief y plan compacto.
4. Solo se activan especialistas necesarios.
5. QA objetivo, reparación automática y máximo dos reintentos.
6. Entrega de manuscrito, informe, estrategia de mercado/KDP y materiales de producción/exportación.

La regla UX es **no bloquear al autor con preguntas**: el Director usa supuestos razonables y permite al usuario corregir decisiones mediante el chat.

## Desarrollo
```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

## Variables de entorno
Revisar `.env.example`. Para producción se necesita una base PostgreSQL y, según las funciones activadas, claves de proveedor de IA/audio.

## Prioridad de implementación
1. Consolidar chat con el Director y persistencia de conversaciones.
2. Ingesta robusta de DOCX/PDF/TXT y transcripción de audio.
3. Orquestador con caché, contexto por fragmentos y QA/reintentos.
4. Exportación completa y descargas verificables.
5. CI con build y pruebas.
