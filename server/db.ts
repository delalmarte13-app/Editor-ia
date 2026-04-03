import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  projects, InsertProject, Project,
  documentVersions, InsertDocumentVersion, DocumentVersion,
  agentAnalyses, InsertAgentAnalysis, AgentAnalysis,
  documentExports, InsertDocumentExport, DocumentExport,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== PROJECTS =====
export async function createProject(data: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(projects).values(data);
  const result = await db.select().from(projects)
    .where(and(eq(projects.userId, data.userId), eq(projects.title, data.title)))
    .orderBy(desc(projects.createdAt)).limit(1);
  return result[0];
}

export async function getProjectsByUser(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectById(id: number, userId: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId))).limit(1);
  return result[0];
}

export async function updateProjectStatus(id: number, userId: number, status: Project["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(projects).set({ status }).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ===== DOCUMENT VERSIONS =====
export async function saveDocumentVersion(data: InsertDocumentVersion): Promise<DocumentVersion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(documentVersions).values(data);
  const result = await db.select().from(documentVersions)
    .where(eq(documentVersions.projectId, data.projectId))
    .orderBy(desc(documentVersions.createdAt)).limit(1);
  return result[0];
}

export async function getLatestVersion(projectId: number): Promise<DocumentVersion | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documentVersions)
    .where(eq(documentVersions.projectId, projectId))
    .orderBy(desc(documentVersions.createdAt)).limit(1);
  return result[0];
}

export async function listVersions(projectId: number, limit = 20): Promise<DocumentVersion[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentVersions)
    .where(eq(documentVersions.projectId, projectId))
    .orderBy(desc(documentVersions.createdAt)).limit(limit);
}

// ===== AGENT ANALYSES =====
export async function saveAnalysis(data: InsertAgentAnalysis): Promise<AgentAnalysis> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agentAnalyses).values(data);
  const result = await db.select().from(agentAnalyses)
    .where(eq(agentAnalyses.projectId, data.projectId))
    .orderBy(desc(agentAnalyses.createdAt)).limit(1);
  return result[0];
}

export async function listAnalyses(projectId: number, limit = 30): Promise<AgentAnalysis[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentAnalyses)
    .where(eq(agentAnalyses.projectId, projectId))
    .orderBy(desc(agentAnalyses.createdAt)).limit(limit);
}

// ===== DOCUMENT EXPORTS =====
export async function saveExport(data: InsertDocumentExport): Promise<DocumentExport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(documentExports).values(data);
  const result = await db.select().from(documentExports)
    .where(eq(documentExports.projectId, data.projectId))
    .orderBy(desc(documentExports.createdAt)).limit(1);
  return result[0];
}

export async function listExports(projectId: number): Promise<DocumentExport[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentExports)
    .where(eq(documentExports.projectId, projectId))
    .orderBy(desc(documentExports.createdAt));
}
