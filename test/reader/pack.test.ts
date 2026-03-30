import { describe, it, expect } from "vitest";
import { join } from "path";
import { packRepo } from "../../src/reader/pack.js";

const fixtures = join(import.meta.dirname, "../fixtures");

describe("packRepo", () => {
  it("packs a node project and returns content as a string", async () => {
    const result = await packRepo(join(fixtures, "node-cli"));
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
    // Should contain the source file content somewhere in the packed output
    expect(result.content).toContain("index.ts");
  });

  it("includes file count metadata", async () => {
    const result = await packRepo(join(fixtures, "node-cli"));
    expect(result.totalFiles).toBeGreaterThan(0);
    expect(result.totalTokens).toBeGreaterThanOrEqual(0);
  });

  it("respects .gitignore (dist/ should be excluded)", async () => {
    const result = await packRepo(join(fixtures, "node-cli"));
    expect(result.content).not.toContain("should be ignored by .gitignore");
  });
});
