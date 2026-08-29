import express from "express";
import { runEditorial, talkToDirector } from "./orchestrator.js";

export const editorialApi = express.Router();
editorialApi.use(express.json({ limit: "8mb" }));

editorialApi.post("/run", async (req, res) => {
  try { res.json(await runEditorial(String(req.body?.text || ""), String(req.body?.instruction || ""))); }
  catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo iniciar la producción" }); }
});

editorialApi.post("/director", (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({ error: "Mensaje vacío" });
  res.json({ message: talkToDirector(message, String(req.body?.manuscript || "")), createdAt: new Date().toISOString() });
});

editorialApi.post("/export/text", (req, res) => {
  const text = String(req.body?.text || ""); const name = String(req.body?.name || "editorial-package").replace(/[^a-z0-9_-]/gi, "-");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${name}.txt"`); res.send(text);
});
