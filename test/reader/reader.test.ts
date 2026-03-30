import { describe, it, expect } from "vitest";
import { join } from "path";
import { readRepo } from "../../src/reader.js";

const fixtures = join(import.meta.dirname, "../fixtures");

describe("readRepo", () => {
  it("returns a complete result for a node project", async () => {
    const result = await readRepo(join(fixtures, "node-cli"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Identity
    expect(result.data.name).toBe("my-node-tool");
    expect(result.data.repoRoot).toContain("node-cli");

    // Manifests
    expect(result.data.manifests.length).toBeGreaterThan(0);
    expect(result.data.manifests[0].type).toBe("package.json");

    // README
    expect(result.data.readme).toContain("my-node-tool");

    // File tree
    expect(result.data.fileTree).toContain("package.json");
    expect(result.data.fileTree).toContain("src/index.ts");

    // Packed content
    expect(result.data.packedContent.length).toBeGreaterThan(0);
  });

  it("handles a project with no manifest gracefully", async () => {
    const result = await readRepo(join(fixtures, "no-manifest"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.manifests).toHaveLength(0);
    expect(result.data.name).toBe("no-manifest"); // falls back to dir name
    expect(result.data.readme).toBeNull();
  });

  it("returns error for nonexistent directory", async () => {
    const result = await readRepo("/nonexistent/path/to/repo");
    expect(result.ok).toBe(false);
  });
});
