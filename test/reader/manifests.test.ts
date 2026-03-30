import { describe, it, expect } from "vitest";
import { join } from "path";
import { detectManifests, extractProjectName } from "../../src/reader/manifests.js";

const fixtures = join(import.meta.dirname, "../fixtures");

describe("detectManifests", () => {
  it("finds package.json in a node project", async () => {
    const result = await detectManifests(join(fixtures, "node-cli"));
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("package.json");
    expect(result[0].path).toBe("package.json");
    expect(result[0].content).toContain("my-node-tool");
  });

  it("finds pyproject.toml in a python project", async () => {
    const result = await detectManifests(join(fixtures, "python-cli"));
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("pyproject.toml");
    expect(result[0].content).toContain("my-python-tool");
  });

  it("finds Cargo.toml in a rust project", async () => {
    const result = await detectManifests(join(fixtures, "rust-cli"));
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("Cargo.toml");
    expect(result[0].content).toContain("my-rust-tool");
  });

  it("finds go.mod in a go project", async () => {
    const result = await detectManifests(join(fixtures, "go-cli"));
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("go.mod");
    expect(result[0].content).toContain("my-go-tool");
  });

  it("returns empty array when no manifest found", async () => {
    const result = await detectManifests(join(fixtures, "no-manifest"));
    expect(result).toHaveLength(0);
  });
});

describe("extractProjectName", () => {
  it("extracts name from package.json", () => {
    const name = extractProjectName([
      { path: "package.json", type: "package.json", content: '{"name": "my-node-tool"}' },
    ]);
    expect(name).toBe("my-node-tool");
  });

  it("extracts name from pyproject.toml", () => {
    const name = extractProjectName([
      { path: "pyproject.toml", type: "pyproject.toml", content: '[project]\nname = "my-python-tool"' },
    ]);
    expect(name).toBe("my-python-tool");
  });

  it("extracts name from Cargo.toml", () => {
    const name = extractProjectName([
      { path: "Cargo.toml", type: "Cargo.toml", content: '[package]\nname = "my-rust-tool"' },
    ]);
    expect(name).toBe("my-rust-tool");
  });

  it("extracts name from go.mod module path", () => {
    const name = extractProjectName([
      { path: "go.mod", type: "go.mod", content: "module github.com/user/my-go-tool\n\ngo 1.21" },
    ]);
    expect(name).toBe("my-go-tool");
  });

  it("returns null when no manifest has a name", () => {
    const name = extractProjectName([]);
    expect(name).toBeNull();
  });
});
