import { readRepo } from "../src/reader.js";

const dir = process.argv[2] || ".";

const result = await readRepo(dir);

if (!result.ok) {
  console.error("Error:", result.error);
  process.exit(1);
}

const { data } = result;

console.log("=== Reader Result ===\n");
console.log("Name:", data.name);
console.log("Repo root:", data.repoRoot);
console.log("\n--- Manifests ---");
for (const m of data.manifests) {
  console.log(`  ${m.type} (${m.content.length} chars)`);
}
console.log("\n--- README ---");
console.log(data.readme ? `  Found (${data.readme.length} chars)` : "  Not found");
console.log("\n--- File Tree ---");
for (const f of data.fileTree) {
  console.log(`  ${f}`);
}
console.log(`\n--- Packed Content ---`);
console.log(`  ${data.packedContent.length} chars`);
console.log(`  First 500 chars:\n`);
console.log(data.packedContent.slice(0, 500));
