import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { join } from "path";

const frontendDir = join(import.meta.dirname, "../../src/frontend");

describe("frontend index.html", () => {
  it("produces a complete HTML document", async () => {
    const html = await readFile(join(frontendDir, "index.html"), "utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("has a walkthrough container", async () => {
    const html = await readFile(join(frontendDir, "index.html"), "utf-8");
    expect(html).toContain('id="walkthrough"');
  });

  it("links to style.css and app.js", async () => {
    const html = await readFile(join(frontendDir, "index.html"), "utf-8");
    expect(html).toContain('href="style.css"');
    expect(html).toContain('src="app.js"');
  });
});

describe("frontend style.css", () => {
  it("uses Century Schoolbook font stack", async () => {
    const css = await readFile(join(frontendDir, "style.css"), "utf-8");
    expect(css).toContain("Century Schoolbook");
    expect(css).toContain("Georgia");
  });
});

describe("frontend app.js", () => {
  it("fetches from /api/root", async () => {
    const js = await readFile(join(frontendDir, "app.js"), "utf-8");
    expect(js).toContain('fetch("/api/root"');
  });

  it("fetches from /api/door on click", async () => {
    const js = await readFile(join(frontendDir, "app.js"), "utf-8");
    expect(js).toContain('fetch("/api/door');
  });

  it("escapes HTML entities", async () => {
    const js = await readFile(join(frontendDir, "app.js"), "utf-8");
    expect(js).toContain("&amp;");
    expect(js).toContain("&lt;");
    expect(js).toContain("&gt;");
  });
});
