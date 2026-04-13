import { Router } from "express";
import { z } from "zod";
import { getDb, users, projects, documentVersions } from "./db";
import { eq, and, desc } from "drizzle-orm";
import agentRouter from "./_core";

const router = Router();

// Usar el router de agentes
router.use(agentRouter);

// Schema de validación mejorados
const projectSchema = z.object({
  title: z.string().trim().min(1).max(512),
  genre: z.string().trim().max(128).optional(),
  description: z.string().trim().max(10000).optional(),
});

const documentSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().min(1),
  versionLabel: z.string().trim().max(128).optional(),
});

// Rutas de proyectos
router.get("/api/projects", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Error de base de datos" });
    }

    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: [desc(projects.updatedAt)],
    });

    res.json(userProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/api/projects", async (req, res) => {  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const validatedData = projectSchema.parse(req.body);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Error de base de datos" });
    }

    const [newProject] = await db.insert(projects).values({
      ...validatedData,
      userId,
    }).returning();

    res.status(201).json(newProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos inválidos", details: error.errors });
    }
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// Rutas de documentos
router.post("/api/documents", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const validatedData = documentSchema.parse(req.body);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Error de base de datos" });
    }

    // Verificar que el proyecto pertenece al usuario
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, parseInt(validatedData.projectId)),
        eq(projects.userId, userId)
      ),
    });
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    // Contar versiones existentes
    const existingVersions = await db.query.documentVersions.findMany({
      where: eq(documentVersions.projectId, parseInt(validatedData.projectId)),
    });

    const versionNumber = existingVersions.length + 1;

    const [newVersion] = await db.insert(documentVersions).values({
      projectId: parseInt(validatedData.projectId),
      userId,
      content: validatedData.content,
      versionLabel: validatedData.versionLabel || `v${versionNumber}`,
      wordCount: validatedData.content.split(/\s+/).length,
      charCount: validatedData.content.length,
    }).returning();

    res.status(201).json(newVersion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos inválidos", details: error.errors });
    }
    console.error("Error creating document:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
