// Mock database for testing without MySQL connection
// This allows us to test the full application flow

interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

interface Project {
  id: number;
  userId: number;
  title: string;
  genre: string | null;
  description: string | null;
  status: "draft" | "in_review" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentVersion {
  id: number;
  projectId: number;
  userId: number;
  content: string;
  wordCount: number;
  charCount: number;
  versionLabel: string | null;
  isAutosave: boolean;
  createdAt: Date;
}

class MockDatabase {
  private users: Map<string, User> = new Map();
  private projects: Map<number, Project> = new Map();
  private documentVersions: Map<number, DocumentVersion> = new Map();
  private nextUserId = 1;
  private nextProjectId = 1;
  private nextVersionId = 1;

  async getUserByOpenId(openId: string): Promise<User | null> {
    return this.users.get(openId) || null;
  }

  async upsertUser(userData: Partial<User> & { openId: string }): Promise<User> {
    let user = this.users.get(userData.openId);
    if (user) {
      user = { ...user, ...userData, updatedAt: new Date() };
    } else {
      user = {
        id: this.nextUserId++,
        openId: userData.openId,
        name: userData.name || null,
        email: userData.email || null,
        loginMethod: userData.loginMethod || null,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    }
    this.users.set(userData.openId, user);
    return user;
  }

  async createProject(userId: number, data: Partial<Project>): Promise<Project> {
    const project: Project = {
      id: this.nextProjectId++,
      userId,
      title: data.title || "",
      genre: data.genre || null,
      description: data.description || null,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(project.id, project);
    return project;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  async getProjectById(id: number, userId: number): Promise<Project | null> {
    const project = this.projects.get(id);
    return project && project.userId === userId ? project : null;
  }

  async createDocumentVersion(data: Partial<DocumentVersion>): Promise<DocumentVersion> {
    const version: DocumentVersion = {
      id: this.nextVersionId++,
      projectId: data.projectId || 0,
      userId: data.userId || 0,
      content: data.content || "",
      wordCount: data.wordCount || 0,
      charCount: data.charCount || 0,
      versionLabel: data.versionLabel || null,
      isAutosave: data.isAutosave || false,
      createdAt: new Date(),
    };
    this.documentVersions.set(version.id, version);
    return version;
  }

  async getLatestDocumentVersion(projectId: number, userId: number): Promise<DocumentVersion | null> {
    const versions = Array.from(this.documentVersions.values()).filter(
      v => v.projectId === projectId && v.userId === userId
    );
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  async getDocumentVersionsByProjectId(projectId: number): Promise<DocumentVersion[]> {
    return Array.from(this.documentVersions.values()).filter(v => v.projectId === projectId);
  }
}

export const mockDb = new MockDatabase();
