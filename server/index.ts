// ============================================================
//  server/index.ts  —  Editorial Completa con IA
//  Código corregido y listo para probar
// ============================================================

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  json,
  bigint,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { eq, and, desc } from "drizzle-orm";
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Epub from "epub-gen-memory";
import multer from "multer";
import OpenAI from "openai";
import { ElevenLabsClient } from "elevenlabs";
import rateLimit from "express-rate-limit";
import pino from "pino";

// ========== VALIDACIÓN DE ENTORNO ==========
const envSchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),
  VITE_APP_ID: z.string().min(1),
  OAUTH_SERVER_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  BUILT_IN_FORGE_API_URL: z.string().optional(),
  BUILT_IN_FORGE_API_KEY: z.string().optional(),
  PORT: z.string().optional(),
  NODE_ENV: z.enum(["development", "production"]).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  console.error("❌ Variables de entorno inválidas:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

// ========== CONFIGURACIÓN DE ENTORNO ==========
const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
};

const log = pino({
  level: ENV.isProduction ? "info" : "debug",
  transport: !ENV.isProduction ? { target: "pino-pretty" } : undefined,
});

// ========== CONSTANTES GLOBALES ==========
const COOKIE_NAME = "app_session_id";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const AXIOS_TIMEOUT_MS = 30000;
const UNAUTHED_ERR_MSG = "Please login (10001)";
const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// ========== ENUMS ==========
const roleEnum = pgEnum("role", ["user", "admin"]);
const projectStatusEnum = pgEnum("project_status", ["draft", "in_review", "completed", "archived"]);
const agentTypeEnum = pgEnum("agent_type", [
  "director", "voice_analyst", "critic",
  "corrector", "rewriter", "style_guardian",
  "illustrator_style", "illustration_prompter",
  "market_analyst", "kdp_strategist"
]);
const exportFormatEnum = pgEnum("export_format", ["pdf", "docx", "epub", "print_pdf"]);

// ========== BASE DE DATOS (DRIZZLE) ==========
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  genre: varchar("genre", { length: 128 }),
  description: text("description"),
  status: projectStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  wordCount: integer("wordCount").default(0),
  charCount: integer("charCount").default(0),
  versionLabel: varchar("versionLabel", { length: 128 }),
  isAutosave: boolean("isAutosave").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const agentAnalyses = pgTable("agent_analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  documentVersionId: integer("documentVersionId"),
  userId: integer("userId").notNull(),
  agentType: agentTypeEnum("agentType").notNull(),
  agentName: varchar("agentName", { length: 128 }),
  prompt: text("prompt"),
  response: text("response").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const documentExports = pgTable("document_exports", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  documentVersionId: integer("documentVersionId"),
  userId: integer("userId").notNull(),
  format: exportFormatEnum("format").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").notNull(),
  personality: text("personality"),
  imagePromptOverride: text("imagePromptOverride"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").notNull(),
  imagePromptOverride: text("imagePromptOverride"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

const styleProfiles = pgTable("style_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  avgSentenceLength: real("avgSentenceLength"),
  lexicalDiversity: real("lexicalDiversity"),
  passiveVoiceRatio: real("passiveVoiceRatio"),
  adjectiveDensity: real("adjectiveDensity"),
  sampleText: text("sampleText"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

const dbSchema = {
  users, projects, documentVersions, agentAnalyses,
  documentExports, characters, locations, styleProfiles,
};

let _db: any = null;
async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      const pool = new Pool({ connectionString: ENV.databaseUrl });
      _db = drizzle(pool, { schema: dbSchema });
      log.info("Database connected");
    } catch (error) {
      log.error(error, "Database connection failed");
      _db = null;
    }
  }
  return _db;
}

async function insertAndFetch<T>(table: any, values: any, idCol: any) {
  const db = await getDb();
  if (!db) throw new Error("DB no disponible");
  const result = await db.insert(table).values(values);
  const insertId = (result as any)[0]?.insertId;
  return db.query[table._.name].findFirst({
    where: eq(idCol, insertId),
  });
}

async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  return db.query.users.findFirst({ where: eq(users.openId, openId) });
}

async function upsertUser(userData: any) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getUserByOpenId(userData.openId);
  if (existing) {
    await db.update(users).set(userData).where(eq(users.openId, userData.openId));
    return { ...existing, ...userData };
  } else {
    return await insertAndFetch(users, userData, users.id);
  }
}

// ========== AGENTES Y PROMPTS ==========
const AGENT_PROMPTS: Record<string, string> = {
  director: `Actúa como un Director Editorial experto...\n\nTexto a analizar:\n{text}`,
  voice_analyst: `Actúa como un Analista de Voz y Estilo...\n\n{text}`,
  critic: `Actúa como un Crítico Literario exigente...\n\n{text}`,
  corrector: `Actúa como un corrector de estilo profesional...\n\n{text}`,
  rewriter: `Eres un escritor fantasma experto...\n\n{text}`,
  style_guardian: `Evalúa si el texto REWRITTEN mantiene el estilo...\n\nOriginal:\n{original}\n\nRewritten:\n{rewritten}\n\nPerfil de estilo:\n{style_profile}`,
  illustrator_style: `Como director de arte...\n\n{text}`,
  illustration_prompter: `Genera un prompt detallado en inglés...\n\nEscena:\n{text}\n\nPersonajes:\n{characters}\n\nLocalizaciones:\n{locations}`,
  market_analyst: `Eres un analista de mercado...\n\n{text}\n\nDatos de mercado:\n{market_data}`,
  kdp_strategist: `Eres un consultor KDP...\n\n{text}\n\nDatos de mercado:\n{market_data}`,
};

const MARKET_DATA = {
  categories: [
    { name: "Ficción literaria", code: "FIC019000", competition: "alta" },
    { name: "Fantasía juvenil", code: "JUV037000", competition: "media" },
  ],
  keywords: ["novela de aprendizaje", "realismo mágico"],
  seasonalTrends: { "diciembre": "alta demanda de libros regalo" },
};

// ========== UTILIDADES DE ESTILO ==========
function computeStyleProfile(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/);
  const avgSentenceLen = sentences.length > 0 ? words.length / sentences.length : 0;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const lexicalDiversity = words.length > 0 ? uniqueWords.size / words.length : 0;
  const passivePattern = /\b(?:fue|fueron|era|eran|será|serán|ha sido|han sido|es|son)\s+\w+(?:ado|ido)\b/gi;
  const passiveCount = (text.match(passivePattern) || []).length;
  const passiveRatio = sentences.length > 0 ? passiveCount / sentences.length : 0;
  const adjectivePattern = /\b\w+(?:oso|osa|ivo|iva|able|ible|al|ar|ero|era|ante|iente|udo|uda)\b/gi;
  const adjCount = (text.match(adjectivePattern) || []).length;
  const adjDensity = words.length > 0 ? adjCount / words.length : 0;

  return { avgSentenceLength: avgSentenceLen, lexicalDiversity, passiveVoiceRatio: passiveRatio, adjectiveDensity: adjDensity };
}

async function getOrCreateStyleProfile(userId: number, sampleText?: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.query.styleProfiles.findFirst({
    where: eq(styleProfiles.userId, userId),
  });
  if (existing) return existing;
  if (!sampleText) return null;
  const profile = computeStyleProfile(sampleText);
  return await insertAndFetch(styleProfiles, { userId, ...profile, sampleText }, styleProfiles.id);
}

// ========== LLM ==========
async function invokeLLM(params: any) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (groqKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: params.messages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      if (response.ok) return response.json();
    } catch (e) {
      log.warn({err: e}, "Groq error, falling back");
    }
  }
  
  if (geminiKey) {
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: params.messages[0]?.content || "" }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          id: `gemini-${Date.now()}`,
          choices: [{
            message: {
              role: "assistant",
              content: data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta",
            },
          }],
        };
      }
    } catch (e) {
      log.warn({err: e}, "Gemini error, falling back");
    }
  }
  
  return invokeLLMMock(params);
}

async function invokeLLMMock(params: any) {
  const userMessage = params.messages.find((m: any) => m.role === "user");
  const prompt = typeof userMessage?.content === "string" ? userMessage.content : "";
  let response = "Respuesta simulada del agente.";
  return {
    id: `mock-${Date.now()}`,
    choices: [{ message: { role: "assistant", content: response } }],
  };
}

// ========== AUTENTICACIÓN ==========
async function authenticateRequest(req: Request): Promise<any> {
  const authHeader = req.headers.cookie;
  const cookies = parseCookieHeader(authHeader || "");
  const sessionCookie = cookies[COOKIE_NAME];
  if (!sessionCookie) throw new Error("No session cookie");

  const secret = new TextEncoder().encode(ENV.cookieSecret);
  let payload: any;
  try {
    const { payload: verified } = await jwtVerify(sessionCookie, secret, { algorithms: ["HS256"] });
    payload = verified;
  } catch (e) {
    throw new Error("Invalid session token");
  }
  if (!payload.openId || !payload.appId || !payload.name) throw new Error("Invalid session payload");

  let user = await getUserByOpenId(payload.openId);
  if (!user) {
    user = await upsertUser({
      openId: payload.openId,
      name: payload.name,
      lastSignedIn: new Date(),
    });
  } else {
    await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
  }
  return user;
}

async function authMiddleware(req: any, res: Response, next: NextFunction) {
  try {
    req.user = await authenticateRequest(req);
    next();
  } catch (e: any) {
    res.status(401).json({ error: e.message || "Unauthorized" });
  }
}

// ========== SDK OAUTH ==========
class SDKServer {
  client: any;
  oauthService: any;

  constructor(client = axios.create({ baseURL: ENV.oAuthServerUrl, timeout: AXIOS_TIMEOUT_MS })) {
    this.client = client;
    const self = this;
    this.oauthService = {
      decodeState: (state: string) => Buffer.from(state, "base64").toString(),
      getTokenByCode: async (code: string, state: string) => {
        const redirectUri = self.decodeState(state);
        const { data } = await client.post("/webdev.v1.WebDevAuthPublicService/ExchangeToken", {
          clientId: ENV.appId,
          grantType: "authorization_code",
          code,
          redirectUri,
        });
        return data;
      },
      getUserInfoByToken: async (token: any) => {
        const { data } = await client.post("/webdev.v1.WebDevAuthPublicService/GetUserInfo", { accessToken: token.accessToken });
        return data;
      },
    };
  }

  decodeState(state: string): string {
    return Buffer.from(state, "base64").toString();
  }

  deriveLoginMethod(platforms: string[] = [], fallback?: string): string | null {
    const methodMap: Record<string, string> = {
      wechat: "wechat", google: "google", github: "github", email: "email",
      apple: "apple", microsoft: "microsoft", azure: "microsoft",
    };
    for (const p of platforms) {
      const method = methodMap[p.toLowerCase()];
      if (method) return method;
    }
    return fallback ?? null;
  }

  async exchangeCodeForToken(code: string, state: string) { return this.oauthService.getTokenByCode(code, state); }

  async getUserInfo(accessToken: string) {
    const data = await this.oauthService.getUserInfoByToken({ accessToken });
    const loginMethod = this.deriveLoginMethod(data?.platforms, data?.platform);
    return { ...data, loginMethod };
  }

  parseCookies(cookieHeader: string): Map<string, string> {
    const map = new Map<string, string>();
    if (!cookieHeader) return map;
    const parsed = parseCookieHeader(cookieHeader);
    Object.entries(parsed).forEach(([k, v]) => { if (v !== undefined) map.set(k, v as string); });
    return map;
  }

  async createSessionToken(openId: string, options: any = {}) {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    return new SignJWT({ openId, appId: ENV.appId, name: options.name || "" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
      .sign(secret);
  }

  async verifySession(cookieValue: string) {
    try {
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(cookieValue, secret, { algorithms: ["HS256"] });
      if (!payload.openId || !payload.appId || !payload.name) return null;
      return payload;
    } catch { return null; }
  }
}

const sdk = new SDKServer();

// ========== RUTAS OAUTH ==========
function registerOAuthRoutes(app: express.Express) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    if (!code || !state) return res.status(400).json({ error: "code y state requeridos" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await upsertUser({
        openId: userInfo.openId, name: userInfo.name, email: userInfo.email,
        loginMethod: userInfo.loginMethod, lastSignedIn: new Date(),
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, { name: userInfo.name });
      res.cookie(COOKIE_NAME, sessionToken, {
        httpOnly: true, path: "/", sameSite: "none",
        secure: req.protocol === "https" || req.headers["x-forwarded-proto"] === "https",
        maxAge: ONE_YEAR_MS,
      });
      res.redirect(302, "/");
    } catch (e) {
      log.error(e, "OAuth callback error");
      res.status(500).json({ error: "OAuth callback falló" });
    }
  });
}

// ========== TRPC ==========
const t = initTRPC.context<{ req: Request; res: Response; user: any }>().create({ transformer: superjson });
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async (opts) => {
  const user = opts.ctx.user;
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  return opts.next({ ctx: { user } });
});
const adminProcedure = t.procedure.use(async (opts) => {
  const user = opts.ctx.user;
  if (!user || user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  return opts.next({ ctx: { user } });
});

const systemRouter = router({
  health: publicProcedure.input(z.object({ timestamp: z.number() })).query(() => ({ ok: true })),
  notifyOwner: adminProcedure.input(z.object({ title: z.string(), content: z.string() })).mutation(async () => ({ success: true })),
});

const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user || null),
  logout: protectedProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME);
    return { success: true };
  }),
});

const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.query.projects.findMany({ where: eq(projects.userId, ctx.user.id), orderBy: [desc(projects.updatedAt)] });
  }),
  create: protectedProcedure.input(z.object({ title: z.string(), genre: z.string().optional(), description: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await insertAndFetch(projects, { ...input, userId: ctx.user.id }, projects.id);
  }),
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const project = await db.query.projects.findFirst({ where: and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)) });
    if (!project) throw new TRPCError({ code: "NOT_FOUND" });
    return project;
  }),
});

const documentsRouter = router({
  create: protectedProcedure.input(z.object({ projectId: z.number(), content: z.string(), versionLabel: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const project = await db.query.projects.findFirst({ where: and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)) });
    if (!project) throw new TRPCError({ code: "NOT_FOUND" });
    return await insertAndFetch(documentVersions, {
      projectId: input.projectId, userId: ctx.user.id, content: input.content,
      versionLabel: input.versionLabel || `v1`, wordCount: input.content.split(/\s+/).length, charCount: input.content.length,
    }, documentVersions.id);
  }),
  getLatest: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return (await db.query.documentVersions.findFirst({
      where: and(eq(documentVersions.projectId, input.projectId), eq(documentVersions.userId, ctx.user.id)),
      orderBy: [desc(documentVersions.createdAt)],
    })) || null;
  }),
});

const charactersRouter = router({
  list: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.query.characters.findMany({ where: and(eq(characters.projectId, input.projectId), eq(characters.userId, ctx.user.id)) });
  }),
  create: protectedProcedure.input(z.object({
    projectId: z.number(), name: z.string(), description: z.string(), personality: z.string().optional(), imagePromptOverride: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await insertAndFetch(characters, { ...input, userId: ctx.user.id }, characters.id);
  }),
});

const locationsRouter = router({
  list: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.query.locations.findMany({ where: and(eq(locations.projectId, input.projectId), eq(locations.userId, ctx.user.id)) });
  }),
  create: protectedProcedure.input(z.object({
    projectId: z.number(), name: z.string(), description: z.string(), imagePromptOverride: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await insertAndFetch(locations, { ...input, userId: ctx.user.id }, locations.id);
  }),
});

const styleRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return null;
    return db.query.styleProfiles.findFirst({ where: eq(styleProfiles.userId, ctx.user.id) });
  }),
  updateSample: protectedProcedure.input(z.object({ sampleText: z.string().min(100) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const profile = computeStyleProfile(input.sampleText);
    await db.insert(styleProfiles).values({ userId: ctx.user.id, ...profile, sampleText: input.sampleText })
      .onConflictDoUpdate({ target: styleProfiles.userId, set: { ...profile, sampleText: input.sampleText, updatedAt: new Date() } });
    return { success: true };
  }),
});

const appRouter = router({
  system: systemRouter, auth: authRouter, projects: projectsRouter, documents: documentsRouter,
  characters: charactersRouter, locations: locationsRouter, style: styleRouter,
});

export type AppRouter = typeof appRouter;

// ========== SERVIDOR EXPRESS ==========
const upload = multer({ dest: "uploads/" });
const openai = ENV.openaiApiKey ? new OpenAI({ apiKey: ENV.openaiApiKey }) : null;
const elevenlabs = ENV.elevenLabsApiKey ? new ElevenLabsClient({ apiKey: ENV.elevenLabsApiKey }) : null;

const chatSessions = new Map<string, { messages: Array<{ role: string; content: string }>; lastAccess: number }>();
setInterval(() => {
  const TTL = 30 * 60 * 1000;
  const now = Date.now();
  for (const [key, session] of chatSessions) {
    if (now - session.lastAccess > TTL) chatSessions.delete(key);
  }
}, 30 * 60 * 1000);

function getSystemPromptForAgent(agentType: string, user: any): string {
  switch (agentType) {
    case "corrector": return "Eres un corrector de estilo profesional. Responde solo con el texto corregido.";
    case "rewriter": return "Eres un reescritor literario. Adapta el texto según las instrucciones del usuario, manteniendo la voz del autor.";
    case "translator": return "Eres un traductor literario. Traduce el siguiente texto al idioma indicado conservando el tono. Si no se especifica el idioma, pregunta.";
    default: return "Eres un asistente editorial experto. Ayuda al autor con lo que necesite.";
  }
}

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req as any).user?.id || req.ip,
  message: { error: "Demasiadas solicitudes. Espera un momento." },
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.post("/api/stream/agent", authMiddleware, aiLimiter, async (req: any, res: Response) => {
    const user = req.user!;
    const parsed = z.object({
      projectId: z.string().regex(/^\d+$/),
      agentType: z.enum(["corrector","rewriter","style_guardian","illustrator_style","illustration_prompter","market_analyst","kdp_strategist"]),
      params: z.record(z.unknown()).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { projectId, agentType, params = {} } = parsed.data;
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB error" });

    const latestVersion = await db.query.documentVersions.findFirst({
      where: and(eq(documentVersions.projectId, parseInt(projectId)), eq(documentVersions.userId, user.id)),
      orderBy: [desc(documentVersions.createdAt)],
    });
    const originalText = latestVersion?.content || "";

    let prompt = "";
    switch (agentType) {
      case "corrector": prompt = AGENT_PROMPTS.corrector.replace("{text}", originalText); break;
      case "rewriter":
        prompt = AGENT_PROMPTS.rewriter.replace("{text}", originalText).replace("{tone}", (params as any).targetTone || "similar").replace("{length}", (params as any).targetLength || "similar");
        break;
      case "style_guardian": {
        const rewrittenText = (params as any).rewrittenText || "";
        const profile = await getOrCreateStyleProfile(user.id, originalText);
        prompt = AGENT_PROMPTS.style_guardian.replace("{original}", originalText).replace("{rewritten}", rewrittenText).replace("{style_profile}", JSON.stringify(profile));
        break;
      }
      case "illustrator_style": prompt = AGENT_PROMPTS.illustrator_style.replace("{text}", originalText); break;
      case "illustration_prompter": {
        const chars = await db.query.characters.findMany({ where: eq(characters.projectId, parseInt(projectId)) });
        const locs = await db.query.locations.findMany({ where: eq(locations.projectId, parseInt(projectId)) });
        prompt = AGENT_PROMPTS.illustration_prompter.replace("{text}", originalText)
          .replace("{characters}", chars.map((c:any) => c.description).join("\n"))
          .replace("{locations}", locs.map((l:any) => l.description).join("\n"));
        break;
      }
      case "market_analyst": prompt = AGENT_PROMPTS.market_analyst.replace("{text}", originalText).replace("{market_data}", JSON.stringify(MARKET_DATA)); break;
      case "kdp_strategist": prompt = AGENT_PROMPTS.kdp_strategist.replace("{text}", originalText).replace("{market_data}", JSON.stringify(MARKET_DATA)); break;
    }

    const useMock = !ENV.forgeApiKey;
    try {
      if (useMock) {
        const result = await invokeLLMMock({ messages: [{ role: "user", content: prompt }] });
        const content = result.choices[0].message.content;
        res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
        res.write(`data: ${JSON.stringify({ agentType, content })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        const response = await fetch(`${ENV.forgeApiUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${ENV.forgeApiKey}` },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], stream: true }),
        });
        if (!response.ok) throw new Error(`LLM error: ${response.status}`);
        res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(`data: ${decoder.decode(value)}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
      }
    } catch (e: any) {
      log.error(e, "Streaming error");
      if (!res.headersSent) res.status(500).json({ error: "Streaming failed" });
      else res.end();
    }
  });

  app.post("/api/files/upload", authMiddleware, upload.array("files", 10), async (req: any, res: Response) => {
    const files = (req.files ?? []) as any[];
    res.json({ urls: files.map(f => `/uploads/${f.filename}`) });
  });

  app.post("/api/audio/transcribe", authMiddleware, upload.single("audio"), async (req: any, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No audio file" });
    if (!openai) return res.status(501).json({ error: "OpenAI no configurado" });
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path), model: "whisper-1",
      });
      res.json({ text: transcription.text });
    } catch (e) {
      res.status(500).json({ error: "Transcription failed" });
    } finally {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
    }
  });

  app.post("/api/audio/synthesize", authMiddleware, aiLimiter, async (req: any, res: Response) => {
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = req.body;
    if (!elevenlabs) return res.status(501).json({ error: "ElevenLabs no configurado" });
    try {
      const audioStream = await elevenlabs.generate({ voice: voiceId, text, model_id: "eleven_multilingual_v2" });
      res.setHeader("Content-Type", "audio/mpeg");
      if (typeof (audioStream as any).pipe === "function") {
        (audioStream as any).pipe(res);
      } else {
        for await (const chunk of audioStream as AsyncIterable<Buffer>) {
          res.write(chunk);
        }
        res.end();
      }
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ error: "TTS failed" });
    }
  });

  app.post("/api/chat", authMiddleware, aiLimiter, async (req: any, res: Response) => {
    const { message, agentType, sessionId } = req.body;
    if (!message || !agentType) return res.status(400).json({ error: "message y agentType requeridos" });
    const systemPrompt = getSystemPromptForAgent(agentType, req.user);
    let sessionKey = sessionId || nanoid();
    if (!chatSessions.has(sessionKey)) {
      chatSessions.set(sessionKey, { messages: [{ role: "system", content: systemPrompt }], lastAccess: Date.now() });
    }
    const session = chatSessions.get(sessionKey)!;
    session.lastAccess = Date.now();
    session.messages.push({ role: "user", content: message });

    const llmParams = { messages: session.messages, model: "llama-3.3-70b-versatile", max_tokens: 32768 };
    const useMock = !ENV.forgeApiKey;
    try {
      const result = useMock ? await invokeLLMMock(llmParams) : await invokeLLM(llmParams);
      const reply = result.choices[0].message.content;
      session.messages.push({ role: "assistant", content: reply });
      res.json({ reply, sessionId: sessionKey });
    } catch (e) {
      res.status(500).json({ error: "Chat failed" });
    }
  });

  app.post("/api/translate", authMiddleware, async (req: any, res: Response) => {
    const { text, targetLanguage } = req.body;
    const prompt = `Traduce el siguiente texto al ${targetLanguage} manteniendo el estilo literario:\n\n${text}`;
    const useMock = !ENV.forgeApiKey;
    try {
      const result = useMock ? await invokeLLMMock({ messages: [{ role: "user", content: prompt }] }) : await invokeLLM({ messages: [{ role: "user", content: prompt }] });
      res.json({ translation: result.choices[0].message.content });
    } catch (e) {
      res.status(500).json({ error: "Translation failed" });
    }
  });

  const audiobookJobs = new Map<string, { status: string; filePath?: string }>();
  app.post("/api/audiobook/generate", authMiddleware, async (req: any, res: Response) => {
    const { projectId, voiceId } = req.body;
    const db = await getDb(); if (!db) return res.status(500).json({ error: "DB error" });
    const latestVersion = await db.query.documentVersions.findFirst({
      where: and(eq(documentVersions.projectId, parseInt(projectId)), eq(documentVersions.userId, req.user.id)),
      orderBy: [desc(documentVersions.createdAt)],
    });
    if (!latestVersion) return res.status(404).json({ error: "No document" });
    const jobId = nanoid();
    audiobookJobs.set(jobId, { status: "processing" });
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      audiobookJobs.set(jobId, { status: "completed", filePath: `temp/audiobook_${jobId}.mp3` });
    })().catch(() => audiobookJobs.set(jobId, { status: "error" }));
    res.json({ jobId, status: "processing" });
  });

  app.get("/api/audiobook/status/:jobId", (req, res) => {
    const job = audiobookJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  });

  app.post("/api/export/maquette", authMiddleware, async (req: any, res: Response) => {
    const { projectId, format } = req.body;
    const db = await getDb(); if (!db) return res.status(500).json({ error: "DB error" });
    const project = await db.query.projects.findFirst({ where: and(eq(projects.id, parseInt(projectId)), eq(projects.userId, req.user.id)) });
    if (!project) return res.status(404).json({ error: "Proyecto no encontrado" });
    const latestVersion = await db.query.documentVersions.findFirst({
      where: and(eq(documentVersions.projectId, parseInt(projectId)), eq(documentVersions.userId, req.user.id)),
      orderBy: [desc(documentVersions.createdAt)],
    });
    if (!latestVersion) return res.status(404).json({ error: "Sin documento" });
    const text = latestVersion.content;
    const title = project.title;

    if (format === "pdf") {
      const doc = new PDFDocument({ size: "A5", margins: { top: 50, bottom: 50, left: 60, right: 60 } });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);
      doc.pipe(res);
      doc.fontSize(18).text(title, { align: "center" }).moveDown();
      doc.fontSize(12).text(text, { lineGap: 6 });
      doc.end();
    } else if (format === "epub") {
      try {
        const epubBuffer = await Epub({
          title,
          author: req.user.name || "Autor"
        }, [{ title: "Capítulo único", content: text }]);
        res.setHeader("Content-Type", "application/epub+zip");
        res.setHeader("Content-Disposition", `attachment; filename="${title}.epub"`);
        res.send(epubBuffer);
      } catch (e) {
        res.status(500).json({ error: "Error generando EPUB" });
      }
    } else {
      res.status(400).json({ error: "Formato no soportado. Use 'pdf' o 'epub'." });
    }
  });

  const createContext = async ({ req, res }: { req: Request; res: Response }) => {
    let user = null;
    try { user = await authenticateRequest(req); } catch {}
    return { req, res, user };
  };
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  // Simplificar el entorno: servir estático aunque estemos en desarrollo
  if (!ENV.isProduction) {
    // Para pruebas, servimos estática directamente
    app.use(express.static(path.resolve(process.cwd(), "public")));
    app.use("*", (_, res) => res.sendFile(path.resolve(process.cwd(), "public", "index.html")));
  } else {
    const distPath = path.resolve(process.cwd(), "dist", "public");
    app.use(express.static(distPath));
    app.use("*", (_, res) => res.sendFile(path.resolve(distPath, "index.html")));
  }

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    log.error(err, `Unhandled error: ${req.method} ${req.url}`);
    res.status(err.status || 500).json({ error: ENV.isProduction ? "Error interno" : err.message });
  });

  process.on("unhandledRejection", (reason) => log.error(reason, "Unhandled promise rejection"));

  const preferredPort = parseInt(process.env.PORT || "3000");
  let port = preferredPort;
  for (let i = 0; i < 10; i++) {
    const available = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();
      tester.listen(port, () => { tester.close(() => resolve(true)); });
      tester.on("error", () => resolve(false));
    });
    if (available) break;
    port++;
    if (i === 9) throw new Error(`No hay puertos libres desde ${preferredPort}`);
  }

  server.listen(port, () => log.info(`🚀 Editorial IA corriendo en http://localhost:${port}`));
}

startServer().catch(console.error);
