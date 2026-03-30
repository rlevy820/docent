import { resolve } from "path";
import { readRepo } from "../src/reader.js";
import { infer } from "../src/inference.js";

const dir = resolve(process.argv[2] || ".");
console.log(`\n[docent] reading ${dir}\n`);

// Step 1: Read
const t1 = performance.now();
const readResult = await readRepo(dir);
if (!readResult.ok) {
  console.error("Reader failed:", readResult.error);
  process.exit(1);
}
console.log(`[${ms(t1)}] reader done: ${readResult.data.name}, ${readResult.data.fileTree.length} files`);

// Step 2: Infer
const t2 = performance.now();
console.log(`[...] calling Claude API...`);
const result = await infer(readResult.data);
console.log(`[${ms(t2)}] inference done\n`);

// Output
console.log("=== Inference Result ===\n");
console.log("What it does:");
console.log(`  ${result.whatItDoes}\n`);
console.log("Who and when:");
console.log(`  ${result.whoAndWhen}\n`);
console.log("Front door:");
console.log(`  File: ${result.frontDoor.file}`);
if (result.frontDoor.command) console.log(`  Command: ${result.frontDoor.command}`);
console.log(`  Description: ${result.frontDoor.description}\n`);
console.log("Scenario:");
console.log(`  ${result.scenario}\n`);

console.log(`[docent] total: ${ms(t1)}`);

function ms(start: number): string {
  return `${(performance.now() - start).toFixed(0)}ms`;
}
