# Editorial de Élite — Editor IA — TODO

## Configuración y Base de Datos
- [x] Configurar secrets: OPENAI_API_KEY, MONGODB_URI
- [x] Esquema de base de datos: projects, documents, versions, analyses, feedback
- [x] Migración SQL ejecutada y verificada
- [x] Helpers de DB para proyectos, versiones y análisis

## Interfaz Premium
- [x] Paleta de colores premium (oscuro/dorado) y tipografía en index.css
- [x] Landing page premium con hero, features y CTA
- [x] Dashboard con sidebar para panel editorial
- [x] Página de gestión de proyectos literarios
- [x] Editor de texto profesional con formato enriquecido (TipTap)
- [x] Guardado automático del editor (autosave)
- [x] Panel de historial de versiones
- [x] Panel de feedback de agentes IA
- [x] Diseño responsive (móvil/tablet/PC)

## Sistema de Agentes IA
- [x] Procedimiento tRPC: Director Editorial (coordina el flujo)
- [x] Procedimiento tRPC: Analista de Voz (análisis de estilo)
- [x] Procedimiento tRPC: Crítico Literario (duro y sin condescendencia)
- [x] Respuestas de agentes renderizadas con Streamdown (markdown)
- [x] Almacenamiento de análisis y feedback en DB
- [x] Historial de análisis por proyecto

## Exportación y Compartir
- [x] Exportación a PDF con formato profesional (PDFKit)
- [x] Exportación a DOCX compatible con Microsoft Word (docx library)
- [x] Almacenamiento de exports en S3
- [x] Enlace de descarga permanente para PDF/DOCX
- [x] Botón de compartir por WhatsApp con enlace de descarga

## Alertas y Notificaciones
- [x] Alerta al propietario cuando usuario complete un proyecto
- [x] Alerta al propietario cuando agente genere crítica importante
- [x] Alerta al propietario por actividad significativa (nuevo proyecto)

## Tests y Despliegue
- [x] Tests Vitest para procedimientos principales (14 tests pasando)
- [x] Commit a GitHub con todo el avance
- [x] Checkpoint final y publicación
