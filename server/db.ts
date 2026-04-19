import { drizzle } from "drizzle-orm/mysql2";
import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp, 
  mysqlEnum 
} from "drizzle-orm/mysql-core";
import { eq, and, desc } from "drizzle-orm";

// Tabla de usuarios
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Tabla de proyectos
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  genre: varchar("genre", { length: 128 }),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "in_review", "completed", "archived"])
    .default("draft")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabla de versiones de documentos
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
// Tabla de análisis de agentes
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

// Tabla de exportaciones
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

// Función para obtener conexión de DB
let _db = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// CORRECCIÓN DE SEGURIDAD: Todas las queries ahora filtran por userId + projectId
export async function getDocumentVersion(versionId: number, userId: number, projectId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.query.documentVersions.findFirst({
    where: and(      eq(documentVersions.id, versionId),
      eq(documentVersions.userId, userId),
      eq(documentVersions.projectId, projectId)
    ),
  });
  
  return result;
}

export async function getAgentAnalyses(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.query.agentAnalyses.findMany({
    where: and(
      eq(agentAnalyses.projectId, projectId),
      eq(agentAnalyses.userId, userId)
    ),
    orderBy: [desc(agentAnalyses.createdAt)],
  });
  
  return result;
}

export async function getDocumentExports(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.query.documentExports.findMany({
    where: and(
      eq(documentExports.projectId, projectId),
      eq(documentExports.userId, userId)
    ),
    orderBy: [desc(documentExports.createdAt)],
  });
  
  return result;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  return await db.query.users.findFirst({
    where: eq(users.openId, openId),
  });
}

export async function upsertUser(userData: any) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await getUserByOpenId(userData.openId);
  if (existing) {
    await db.update(users).set(userData).where(eq(users.openId, userData.openId));
    return { ...existing, ...userData };
  } else {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }
}
