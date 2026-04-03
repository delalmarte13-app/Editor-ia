import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import {
  createProject, getProjectsByUser, getProjectById, updateProjectStatus,
  saveDocumentVersion, getLatestVersion, listVersions,
  saveAnalysis, listAnalyses,
  saveExport, listExports,
} from "./db";
import { storagePut } from "./storage";
import { generatePDF } from "./exporters/pdf";
import { generateDOCX } from "./exporters/docx";

// ===== AGENT PROMPTS =====
const AGENT_PROMPTS = {
  director: (content: string) => `Eres el Director Editorial de una editorial literaria de élite. Tu rol es coordinar y evaluar el trabajo desde una perspectiva estratégica y editorial.

Analiza el siguiente texto con autoridad editorial. Evalúa:
1. **Estructura narrativa**: ¿El texto tiene una arquitectura sólida? ¿Hay coherencia entre inicio, desarrollo y cierre?
2. **Potencial editorial**: ¿Tiene valor literario real? ¿Es publicable en su estado actual?
3. **Decisiones editoriales**: ¿Qué cambios estructurales son imprescindibles?
4. **Hoja de ruta**: Indica los próximos pasos concretos para mejorar el texto.

Sé directo, profesional y sin condescendencia. No halagues innecesariamente.

TEXTO A ANALIZAR:
${content}`,

  voice_analyst: (content: string) => `Eres el Analista de Voz Narrativa de una editorial literaria de élite. Tu especialidad es el estudio profundo del estilo de escritura.

Analiza el siguiente texto e identifica con precisión:
1. **Voz narrativa**: ¿Cómo es la voz del autor? ¿Primera, segunda, tercera persona? ¿Qué tono predomina?
2. **Ritmo y cadencia**: Analiza la longitud de las frases, el ritmo del texto, los patrones de puntuación.
3. **Vocabulario y registro**: ¿Qué nivel léxico emplea? ¿Hay coherencia en el registro lingüístico?
4. **Marcas de estilo**: Identifica tics, repeticiones, recursos retóricos favoritos y patrones sintácticos característicos.
5. **Perfil de voz**: Genera un perfil sintético de la identidad literaria del autor.
6. **Recomendaciones**: ¿Cómo puede el autor potenciar su voz única?

Sé analítico, preciso y técnico. Usa terminología literaria apropiada.

TEXTO A ANALIZAR:
${content}`,

  critic: (content: string) => `Eres un Crítico Literario de élite, conocido por tu rigor intelectual y tu negativa absoluta a la condescendencia. Tu crítica es dura, honesta y constructiva. No endulzas la realidad.

Critica el siguiente texto sin piedad pero con fundamento. Evalúa:
1. **Debilidades estructurales**: ¿Dónde falla la arquitectura del texto?
2. **Problemas de estilo**: ¿Qué vicios de escritura son evidentes? ¿Clichés, redundancias, ambigüedades?
3. **Coherencia y lógica**: ¿Hay inconsistencias, contradicciones o saltos lógicos?
4. **Impacto emocional**: ¿El texto conecta con el lector? ¿Por qué sí o por qué no?
5. **Comparación con el canon**: ¿Cómo se posiciona este texto frente a obras del género?
6. **Veredicto**: ¿Vale la pena continuar con este texto? ¿Qué debe cambiar radicalmente?

No suavices tu análisis. El escritor necesita la verdad, no comodidad.

TEXTO A ANALIZAR:
${content}`,
};

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== PROJECTS =====
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getProjectsByUser(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await getProjectById(input.id, ctx.user.id);
        if (!project) throw new Error("Proyecto no encontrado");
        return project;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(512),
        genre: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const project = await createProject({
          userId: ctx.user.id,
          title: input.title,
          genre: input.genre ?? null,
          description: input.description ?? null,
          status: "draft",
        });
        await notifyOwner({
          title: "Nuevo proyecto creado",
          content: `El usuario ${ctx.user.name ?? ctx.user.email} ha creado el proyecto: "${input.title}"`,
        }).catch(() => {});
        return project;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "in_review", "completed", "archived"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateProjectStatus(input.id, ctx.user.id, input.status);
        if (input.status === "completed") {
          const project = await getProjectById(input.id, ctx.user.id);
          await notifyOwner({
            title: "Proyecto completado",
            content: `El usuario ${ctx.user.name ?? ctx.user.email} ha completado el proyecto: "${project?.title}"`,
          }).catch(() => {});
        }
        return { success: true };
      }),
  }),

  // ===== DOCUMENTS =====
  documents: router({
    saveVersion: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        content: z.string(),
        wordCount: z.number().optional(),
        charCount: z.number().optional(),
        versionLabel: z.string().optional(),
        isAutosave: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return saveDocumentVersion({
          projectId: input.projectId,
          userId: ctx.user.id,
          content: input.content,
          wordCount: input.wordCount ?? 0,
          charCount: input.charCount ?? 0,
          versionLabel: input.versionLabel ?? null,
          isAutosave: input.isAutosave ?? false,
        });
      }),

    getLatest: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getLatestVersion(input.projectId);
      }),

    listVersions: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return listVersions(input.projectId, input.limit ?? 20);
      }),
  }),

  // ===== AGENTS =====
  agents: router({
    run: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        agentType: z.enum(["director", "voice_analyst", "critic"]),
        content: z.string().min(50),
      }))
      .mutation(async ({ ctx, input }) => {
        const promptFn = AGENT_PROMPTS[input.agentType];
        const plainText = input.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const prompt = promptFn(plainText);
        const agentNames = {
          director: "Director Editorial",
          voice_analyst: "Analista de Voz",
          critic: "Crítico Literario",
        };
        const response = await invokeLLM({
          messages: [
            { role: "system" as const, content: prompt },
            { role: "user" as const, content: "Procede con el an\u00e1lisis." },
          ],
        });
        const rawContent = response.choices[0]?.message?.content;
        const responseText: string = typeof rawContent === "string" ? rawContent : "Sin respuesta del agente.";
        const analysis = await saveAnalysis({
          projectId: input.projectId,
          userId: ctx.user.id,
          agentType: input.agentType,
          agentName: agentNames[input.agentType],
          prompt: prompt.slice(0, 1000),
          response: responseText,
        });
        if (input.agentType === "critic") {
          await notifyOwner({
            title: "Análisis crítico generado",
            content: `El agente Crítico Literario ha analizado el proyecto del usuario ${ctx.user.name ?? ctx.user.email}.`,
          }).catch(() => {});
        }
        return { response: responseText, analysisId: analysis.id };
      }),

    listAnalyses: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return listAnalyses(input.projectId, input.limit ?? 30);
      }),
  }),

  // ===== EXPORTS =====
  exports: router({
    generate: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        content: z.string(),
        title: z.string(),
        format: z.enum(["pdf", "docx"]),
      }))
      .mutation(async ({ ctx, input }) => {
        let fileBuffer: Buffer;
        let contentType: string;
        let extension: string;
        if (input.format === "pdf") {
          fileBuffer = await generatePDF(input.title, input.content);
          contentType = "application/pdf";
          extension = "pdf";
        } else {
          fileBuffer = await generateDOCX(input.title, input.content);
          contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          extension = "docx";
        }
        const timestamp = Date.now();
        const safeTitle = input.title.slice(0, 30).replace(/[^a-z0-9]/gi, "_");
        const fileKey = `exports/${ctx.user.id}/${input.projectId}/${timestamp}-${safeTitle}.${extension}`;
        const { url } = await storagePut(fileKey, fileBuffer, contentType);
        const exportRecord = await saveExport({
          projectId: input.projectId,
          userId: ctx.user.id,
          format: input.format,
          fileKey,
          fileUrl: url,
          fileSize: fileBuffer.length,
        });
        return { fileUrl: url, format: input.format, exportId: exportRecord.id };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return listExports(input.projectId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
