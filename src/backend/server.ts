import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import type { ReaderResult } from "./reader/types.js";
import type { Space } from "./space.js";
import { generateSpace } from "./space.js";

const FRONTEND_DIR = join(import.meta.dirname, "../frontend");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
};

export async function serve(reader: ReaderResult, port: number = 3000): Promise<void> {
  // The path of spaces the reader has walked through
  const spaces: Space[] = [];

  // Generate the root space
  const root = await generateSpace(reader, []);
  spaces.push(root);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);

    // --- API routes ---

    if (url.pathname === "/api/root") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(root));
      return;
    }

    if (url.pathname === "/api/door") {
      const depth = parseInt(url.searchParams.get("depth") || "0");
      const doorIndex = parseInt(url.searchParams.get("door") || "0");

      // Trim the path to the depth of the clicked door + 1
      const path = spaces.slice(0, depth + 1);

      const parentSpace = path[depth];
      if (!parentSpace || !parentSpace.doors[doorIndex]) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid door" }));
        return;
      }

      try {
        const newSpace = await generateSpace(reader, path);

        // Trim spaces array to current path and add the new space
        spaces.length = depth + 1;
        spaces.push(newSpace);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(newSpace));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to generate space" }));
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
