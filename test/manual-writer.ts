import { resolve } from "path";
import { readRepo } from "../src/backend/reader.js";
import { serve } from "../src/backend/server.js";
// Usage: npx tsx test/manual-writer.ts [repo-path] [port]

const dir = resolve(process.argv[2] || ".");
const port = parseInt(process.argv[3] || "3000");

console.log(`\n[docent] reading ${dir}\n`);

const t1 = performance.now();
const readResult = await readRepo(dir);
if (!readResult.ok) {
  console.error("Reader failed:", readResult.error);
  process.exit(1);
}
console.log(
  `[${ms(t1)}] reader done: ${readResult.data.name}, ${readResult.data.fileTree.length} files`,
);

console.log(`[...] generating root space...`);
const t2 = performance.now();
await serve(readResult.data, port);
console.log(`[${ms(t2)}] server ready\n`);

function ms(start: number): string {
  return `${(performance.now() - start).toFixed(0)}ms`;
}
