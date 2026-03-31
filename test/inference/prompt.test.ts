import { describe, it, expect } from "vitest";
import { buildPrompt, generateSpace } from "../../src/backend/space.js";
import type { Space } from "../../src/backend/space.js";
import type { ReaderResult } from "../../src/backend/reader/types.js";

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

describe("buildPrompt — root space", () => {
  const { system, user } = buildPrompt(fakeReader, []);

  it("returns system and user messages", () => {
    expect(typeof system).toBe("string");
    expect(typeof user).toBe("string");
    expect(system.length).toBeGreaterThan(0);
    expect(user.length).toBeGreaterThan(0);
  });

  it("indicates this is the first thing the reader sees", () => {
    expect(system).toContain("reader has not been told anything yet");
  });

  it("instructs root space to place the building", () => {
    expect(system).toContain("root space");
    expect(system).toContain("what world");
  });

  it("contains the NLP quality bar passage", () => {
    expect(system).toContain("Great work this week");
    expect(system).toContain("We need to talk about your performance");
  });

  it("enforces strict language rules", () => {
    expect(system).toContain("No technical terms unless you explained them first");
    expect(system).toContain("No invented metaphors");
    expect(system).toContain("No \"imagine.\"");
  });

  it("instructs JSON output with content and doors", () => {
    expect(system).toContain("JSON");
    expect(system).toContain('"content"');
    expect(system).toContain('"doors"');
    expect(system).toContain('"label"');
  });

  it("includes repo content in the user message", () => {
    expect(user).toContain("packed source code");
    expect(user).toContain("A tool that does fake things");
    expect(user).toContain("src/index.ts");
    expect(user).toContain("fake-tool");
  });

  it("handles missing README gracefully", () => {
    const noReadme = { ...fakeReader, readme: null };
    const { user } = buildPrompt(noReadme, []);
    expect(user).not.toContain("undefined");
  });
});

describe("buildPrompt — deeper space", () => {
  const prevSpaces: Space[] = [
    {
      content: "Glasses with a camera and microphone. This project uses them to remember people.",
      doors: [{ label: "How do the glasses send what they see?" }],
    },
  ];

  const { system } = buildPrompt(fakeReader, prevSpaces);

  it("includes the previous spaces in the system prompt", () => {
    expect(system).toContain("Glasses with a camera and microphone");
    expect(system).toContain("remember people");
  });

  it("states the reader knows only what has been shown", () => {
    expect(system).toContain("entirety of what they know");
  });

  it("does not include root space instructions", () => {
    expect(system).not.toContain("root space");
  });

  it("instructs incremental building", () => {
    expect(system).toContain("one new idea");
  });
});
