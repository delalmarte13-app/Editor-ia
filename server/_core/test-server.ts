import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { mockDb } from "../db-mock";
import { invokeLLM } from "./llm";
import { AGENT_PROMPTS } from "../agents/prompts";

// Mock user for testing
const TEST_USER = {
  id: 1,
  openId: "test-user-123",
  name: "Test Editor",
  email: "test@editor.local",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// Mock context factory
async function createTestContext(opts: any) {
  return {
    req: opts.req,
    res: opts.res,
    user: TEST_USER,
  };
}

async function startTestServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Streaming Agent API
  app.post("/api/stream/agent", async (req, res) => {
    try {
      const { projectId, agentType } = req.body;

      const latestVersion = await mockDb.getLatestDocumentVersion(projectId, TEST_USER.id);
      const text = latestVersion?.content || "";
      const prompt = (AGENT_PROMPTS as any)[agentType]?.replace("{text}", text) || "Analiza este texto.";

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
      res.status(500).json({ error: "Streaming failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: createTestContext,
    })
  );

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("../dist/public"));
  }

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log(`🚀 Test Server running on http://localhost:${port}/`);
    console.log(`📝 API available at http://localhost:${port}/api/trpc`);
    console.log(`🤖 Streaming available at http://localhost:${port}/api/stream/agent`);
  });

  return { server, app };
}

export { startTestServer, mockDb, TEST_USER };
