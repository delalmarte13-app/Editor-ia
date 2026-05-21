import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "client",
  build: { 
    outDir: "../dist/public",
    emptyOutDir: true
  },
  server: { 
    proxy: { 
      "/api": "http://localhost:3000", 
      "/api/trpc": "http://localhost:3000" 
    } 
  },
});
