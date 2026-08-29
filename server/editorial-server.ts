import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { editorialApi } from "./editorial-api.js";

const app = express();
app.use("/api/editorial", editorialApi);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.resolve(__dirname, "../public")));
app.get("*", (_req, res) => res.sendFile(path.resolve(__dirname, "../public/index.html")));
app.listen(Number(process.env.PORT || 3000), () => console.log("EditorialAI listening"));
