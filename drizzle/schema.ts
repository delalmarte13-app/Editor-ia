import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Proyectos literarios
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  genre: varchar("genre", { length: 128 }),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "in_review", "completed", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Versiones de documentos (contenido del editor)
export const documentVersions = mysqlTable("document_versions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  wordCount: int("wordCount").default(0),
  charCount: int("charCount").default(0),
  versionLabel: varchar("versionLabel", { length: 128 }),
  isAutosave: boolean("isAutosave").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;

// Análisis de agentes IA
export const agentAnalyses = mysqlTable("agent_analyses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  documentVersionId: int("documentVersionId"),
  userId: int("userId").notNull(),
  agentType: mysqlEnum("agentType", ["director", "voice_analyst", "critic"]).notNull(),
  agentName: varchar("agentName", { length: 128 }),
  prompt: text("prompt"),
  response: text("response").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentAnalysis = typeof agentAnalyses.$inferSelect;
export type InsertAgentAnalysis = typeof agentAnalyses.$inferInsert;

// Exports (PDF/DOCX) almacenados en S3
export const documentExports = mysqlTable("document_exports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  documentVersionId: int("documentVersionId"),
  userId: int("userId").notNull(),
  format: mysqlEnum("format", ["pdf", "docx"]).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentExport = typeof documentExports.$inferSelect;
export type InsertDocumentExport = typeof documentExports.$inferInsert;