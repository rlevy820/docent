import { describe, it, expect } from "vitest";
import { buildPrompt } from "../../src/inference/prompt.js";
import type { ReaderResult } from "../../src/reader/types.js";

const fakeReader: ReaderResult = {
  repoRoot: "/tmp/fake-repo",
  name: "fake-tool",
  manifests: [
    { path: "package.json", type: "package.json", content: '{"name":"fake-tool","bin":"./cli.js"}' },
  ],
  readme: "# fake-tool\nA tool that does fake things.",
  fileTree: ["package.json", "cli.js", "src/index.ts", "README.md"],
  packedContent: "<files>...packed source code...</files>",
};

describe("buildPrompt", () => {
  it("returns a system message and a user message", () => {
    const { system, user } = buildPrompt(fakeReader);
    expect(typeof system).toBe("string");
    expect(typeof user).toBe("string");
    expect(system.length).toBeGreaterThan(0);
    expect(user.length).toBeGreaterThan(0);
  });

  it("includes the packed content in the user message", () => {
    const { user } = buildPrompt(fakeReader);
    expect(user).toContain("packed source code");
  });

  it("includes the README in the user message", () => {
    const { user } = buildPrompt(fakeReader);
    expect(user).toContain("A tool that does fake things");
  });

  it("includes the file tree in the user message", () => {
    const { user } = buildPrompt(fakeReader);
    expect(user).toContain("src/index.ts");
  });

  it("includes manifest content in the user message", () => {
    const { user } = buildPrompt(fakeReader);
    expect(user).toContain("fake-tool");
  });

  it("asks all four questions", () => {
    const { system } = buildPrompt(fakeReader);
    expect(system).toContain("What does this project do");
    expect(system).toContain("Who would use it");
    expect(system).toContain("front door");
    expect(system).toContain("scenario");
  });

  it("instructs JSON output", () => {
    const { system } = buildPrompt(fakeReader);
    expect(system).toContain("JSON");
  });

  it("handles missing README gracefully", () => {
    const noReadme = { ...fakeReader, readme: null };
    const { user } = buildPrompt(noReadme);
    expect(user).not.toContain("undefined");
  });
});
