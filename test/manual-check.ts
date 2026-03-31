import { resolve, basename } from "path";
import { detectManifests, extractProjectName } from "../src/backend/reader/manifests.js";
import { findReadme, buildFileTree } from "../src/backend/reader/context.js";
import { packRepo } from "../src/backend/reader/pack.js";

const dir = resolve(process.argv[2] || ".");
console.log(`\n[docent] reading ${dir}\n`);

// Step 1: Manifests
const t1 = performance.now();
const manifests = await detectManifests(dir);
const name = extractProjectName(manifests) ?? basename(dir);
console.log(`[${ms(t1)}] manifests: found ${manifests.length} (${manifests.map((m) => m.type).join(", ") || "none"})`);
console.log(`[${ms(t1)}] project name: ${name}`);

// Step 2: README
const t2 = performance.now();
const readme = await findReadme(dir);
console.log(`[${ms(t2)}] readme: ${readme ? `found (${readme.length} chars)` : "not found"}`);

// Step 3: File tree
const t3 = performance.now();
const fileTree = await buildFileTree(dir);
console.log(`[${ms(t3)}] file tree: ${fileTree.length} files`);

// Step 4: Pack
const t4 = performance.now();
const packResult = await packRepo(dir);
console.log(`[${ms(t4)}] repomix: packed ${packResult.totalFiles} files, ${packResult.totalTokens} tokens, ${packResult.content.length} chars`);

// Summary
console.log(`\n[docent] done in ${ms(t1)} total\n`);

// Details (if --verbose or -v flag)
if (process.argv.includes("--verbose") || process.argv.includes("-v")) {
  console.log("--- File Tree ---");
  for (const f of fileTree) console.log(`  ${f}`);

  console.log("\n--- Packed Content (first 2000 chars) ---");
  console.log(packResult.content.slice(0, 2000));
}

function ms(start: number): string {
  return `${(performance.now() - start).toFixed(0)}ms`;
}
