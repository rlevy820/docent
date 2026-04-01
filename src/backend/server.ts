import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import type { ReaderResult } from "./reader/types.js";
import { buildWalkthrough } from "./walkthrough.js";

const FRONTEND_DIR = join(import.meta.dirname, "../frontend");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
};

export async function serve(reader: ReaderResult, port: number = 3000): Promise<void> {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);

    // --- API routes ---

    if (url.pathname === "/api/walkthrough") {
      try {
        const walkthrough = await buildWalkthrough(reader);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(walkthrough));
      } catch (err) {
        console.error("[docent] failed to build walkthrough:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to build walkthrough" }));
      }
      return;
    }

    // --- Static frontend files ---

    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const fullPath = join(FRONTEND_DIR, filePath);

    // Prevent path traversal
    if (!fullPath.startsWith(FRONTEND_DIR)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    try {
      const content = await readFile(fullPath);
      const ext = extname(fullPath);
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  });

  server.listen(port, () => {
    console.log(`[docent] http://localhost:${port}`);
  });
}
