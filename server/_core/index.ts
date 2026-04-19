import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { invokeLLM } from "./llm";
import { AGENT_PROMPTS } from "../agents/prompts";
import { getDb, documentVersions } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { sdk } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Streaming Agent API
  app.post("/api/stream/agent", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { projectId, agentType } = req.body;
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB error" });

      const latestVersion = await db.query.documentVersions.findFirst({
        where: and(
          eq(documentVersions.projectId, parseInt(projectId)),
          eq(documentVersions.userId, user.id)
        ),
        orderBy: [desc(documentVersions.createdAt)],
      });

      const text = latestVersion?.content || "";
      const prompt = AGENT_PROMPTS[agentType as keyof typeof AGENT_PROMPTS]?.replace("{text}", text) || "Analiza este texto.";

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const result = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
      });

      const content = result.choices[0].message.content;
      const chunks = typeof content === "string" ? [content] : [];
      
      for (const chunk of chunks) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Streaming error:", error);
      res.status(500).end();
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
