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

console.log("Scenario:");
console.log(`  ${result.scenario}\n`);

console.log("Exterior:");
console.log(`  ${result.exterior}\n`);

console.log("Building kind:");
console.log(`  ${result.buildingKind}\n`);

console.log("Sides:");
console.log(`  ${result.sides}\n`);

console.log("Doors:");
for (const door of result.doors) {
  console.log(`  [${door.relationship}]`);
  console.log(`    File: ${door.file}`);
  if (door.command) console.log(`    Command: ${door.command}`);
  console.log(`    ${door.description}`);
}
console.log();

console.log("Visitor walkthrough:");
for (let i = 0; i < result.visitorWalkthrough.length; i++) {
  const step = result.visitorWalkthrough[i];
  console.log(`  ${i + 1}. ${step.action}`);
  console.log(`     -> ${step.result}`);
}
console.log();

console.log("Rooms:");
for (const room of result.rooms) {
  console.log(`  [${room.problem}]`);
  console.log(`    ${room.description}`);
  console.log(`    Files: ${room.files.join(", ")}`);
}
console.log();

console.log("Term pairs:");
for (const pair of result.termPairs) {
  console.log(`  "${pair.plain}" -> ${pair.term}`);
}
console.log();

console.log(`[docent] total: ${ms(t1)}`);

function ms(start: number): string {
  return `${(performance.now() - start).toFixed(0)}ms`;
}
