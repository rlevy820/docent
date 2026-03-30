import { describe, it, expect } from "vitest";
import { join } from "path";
import { findReadme, buildFileTree } from "../../src/reader/context.js";

const fixtures = join(import.meta.dirname, "../fixtures");

describe("findReadme", () => {
  it("finds README.md in a project", async () => {
    const result = await findReadme(join(fixtures, "node-cli"));
    expect(result).not.toBeNull();
    expect(result).toContain("my-node-tool");
  });

  it("returns null when no README exists", async () => {
    const result = await findReadme(join(fixtures, "no-manifest"));
    expect(result).toBeNull();
  });
});

describe("buildFileTree", () => {
  it("lists files in a project", async () => {
    const tree = await buildFileTree(join(fixtures, "node-cli"));
    expect(tree).toContain("package.json");
    expect(tree).toContain("src/index.ts");
    expect(tree).toContain("README.md");
  });

  it("excludes .gitignore'd paths", async () => {
    const tree = await buildFileTree(join(fixtures, "node-cli"));
    const hasDistFile = tree.some((f) => f.startsWith("dist/"));
    expect(hasDistFile).toBe(false);
  });

  it("excludes .git directory", async () => {
    const tree = await buildFileTree(join(fixtures, "node-cli"));
    const hasGit = tree.some((f) => f.startsWith(".git/") || f === ".git");
    expect(hasGit).toBe(false);
  });

  it("excludes binary files (images, data)", async () => {
    const tree = await buildFileTree(join(fixtures, "node-cli"));
    const binaryFiles = tree.filter(
      (f) => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".npz"),
    );
    expect(binaryFiles).toHaveLength(0);
  });

  it("returns empty array for empty directory", async () => {
    const tree = await buildFileTree(join(fixtures, "no-manifest"));
    expect(tree).toEqual([]);
  });
});
