import { z } from "zod";
import { getDb, projects, documentVersions } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { TRPCError } from "@trpc/server";

// Schema de validación mejorados
const projectSchema = z.object({
  title: z.string().trim().min(1).max(512),
  genre: z.string().trim().max(128).optional(),
  description: z.string().trim().max(10000).optional(),
});

const documentSchema = z.object({
  projectId: z.number(),
  content: z.string().min(1),
  versionLabel: z.string().trim().max(128).optional(),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      return ctx.user || null;
    }),
    logout: protectedProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("app_session_id");
      return { success: true };
    }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB connection failed" });

      return await db.query.projects.findMany({
        where: eq(projects.userId, ctx.user.id),
        orderBy: [desc(projects.updatedAt)],
      });
    }),

    create: protectedProcedure
      .input(projectSchema)
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB connection failed" });

        const [newProject] = await db.insert(projects).values({
          ...input,
          userId: ctx.user.id,
        }).returning();

        return newProject;
      }),
      
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB connection failed" });

        const project = await db.query.projects.findFirst({
          where: and(
            eq(projects.id, input.id),
            eq(projects.userId, ctx.user.id)
          ),
        });

        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        return project;
      }),
  }),

  documents: router({
    create: protectedProcedure
      .input(documentSchema)
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB connection failed" });

        // Verificar que el proyecto pertenece al usuario
        const project = await db.query.projects.findFirst({
          where: and(
            eq(projects.id, input.projectId),
            eq(projects.userId, ctx.user.id)
          ),
        });
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

        // Contar versiones existentes
        const existingVersions = await db.query.documentVersions.findMany({
          where: eq(documentVersions.projectId, input.projectId),
        });

        const versionNumber = existingVersions.length + 1;

        const [newVersion] = await db.insert(documentVersions).values({
          projectId: input.projectId,
          userId: ctx.user.id,
          content: input.content,
          versionLabel: input.versionLabel || `v${versionNumber}`,
          wordCount: input.content.split(/\s+/).length,
          charCount: input.content.length,
        }).returning();

        return newVersion;
      }),
      
    getLatest: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB connection failed" });

        const version = await db.query.documentVersions.findFirst({
          where: and(
            eq(documentVersions.projectId, input.projectId),
            eq(documentVersions.userId, ctx.user.id)
          ),
          orderBy: [desc(documentVersions.createdAt)],
        });

        return version || null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
