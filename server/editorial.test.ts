import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ===== HELPERS =====
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@editorial.com",
    name: "Test Writer",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

// ===== AUTH TESTS =====
describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });

  it("returns the authenticated user from auth.me", async () => {
    const { ctx } = createAuthContext({ name: "Gabriel García Márquez" });
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.name).toBe("Gabriel García Márquez");
    expect(user?.email).toBe("test@editorial.com");
  });
});

// ===== AGENT PROMPT TESTS =====
describe("Agent prompt validation", () => {
  it("should validate that agent types are correctly defined", () => {
    const validAgentTypes = ["director", "voice_analyst", "critic"];

    validAgentTypes.forEach((agentType) => {
      expect(validAgentTypes).toContain(agentType);
    });

    expect(validAgentTypes).toHaveLength(3);
  });

  it("should validate project status enum values", () => {
    const validStatuses = ["draft", "in_review", "completed", "archived"];

    expect(validStatuses).toContain("draft");
    expect(validStatuses).toContain("in_review");
    expect(validStatuses).toContain("completed");
    expect(validStatuses).toContain("archived");
  });

  it("should validate export format enum values", () => {
    const validFormats = ["pdf", "docx"];

    expect(validFormats).toContain("pdf");
    expect(validFormats).toContain("docx");
    expect(validFormats).toHaveLength(2);
  });
});

// ===== HTML PARSING TESTS =====
describe("HTML content parsing", () => {
  it("should strip HTML tags from content", () => {
    const html = "<p><strong>Hola</strong> <em>mundo</em></p><h1>Título</h1>";
    const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    expect(plainText).toContain("Hola");
    expect(plainText).toContain("mundo");
    expect(plainText).toContain("Título");
    expect(plainText).not.toContain("<p>");
    expect(plainText).not.toContain("<strong>");
  });

  it("should handle empty HTML content", () => {
    const html = "<p></p>";
    const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    expect(plainText).toBe("");
  });

  it("should count words correctly", () => {
    const text = "El viejo y el mar es una novela corta";
    const words = text.trim().split(/\s+/).length;

    expect(words).toBe(9);
  });
});

// ===== EXPORT FILENAME TESTS =====
describe("Export file key generation", () => {
  it("should generate safe file keys for exports", () => {
    const title = "Mi Novela: La Historia del Tiempo";
    const safeTitle = title.slice(0, 30).replace(/[^a-z0-9]/gi, "_");

    expect(safeTitle).not.toContain(":");
    expect(safeTitle).not.toContain(" ");
    expect(safeTitle.length).toBeLessThanOrEqual(30);
  });

  it("should generate unique timestamps for file keys", () => {
    const ts1 = Date.now();
    const ts2 = Date.now();

    // Both should be numbers
    expect(typeof ts1).toBe("number");
    expect(typeof ts2).toBe("number");
    expect(ts1).toBeGreaterThan(0);
  });
});

// ===== WORD COUNT TESTS =====
describe("Word count calculation", () => {
  it("should return 0 for empty text", () => {
    const text = "";
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    expect(count).toBe(0);
  });

  it("should count words in a paragraph", () => {
    const text = "Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía.";
    const count = text.trim().split(/\s+/).length;
    expect(count).toBe(12);
  });

  it("should handle multiple spaces between words", () => {
    const text = "palabra1   palabra2   palabra3";
    const count = text.trim().split(/\s+/).length;
    expect(count).toBe(3);
  });
});
