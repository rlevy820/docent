import { readFile, access } from "fs/promises";
import { join, basename } from "path";
import { parse as parseTOML } from "smol-toml";
import type { ManifestFile } from "./types.js";

/**
 * Known manifest filenames in priority order.
 * Order matters: Cargo.toml and go.mod are unambiguous,
 * while package.json can appear in non-Node projects.
 */
const KNOWN_MANIFESTS = [
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "setup.py",
  "package.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Gemfile",
  "composer.json",
  "mix.exs",
  "CMakeLists.txt",
  "Makefile",
];

/** Scan a repo root for manifest files and return them with contents. */
export async function detectManifests(repoRoot: string): Promise<ManifestFile[]> {
  const found: ManifestFile[] = [];

  for (const filename of KNOWN_MANIFESTS) {
    const fullPath = join(repoRoot, filename);
    try {
      await access(fullPath);
      const content = await readFile(fullPath, "utf-8");
      found.push({ path: filename, type: filename, content });
    } catch {
      // File doesn't exist, skip
    }
  }

  return found;
}

/** Extract a project name from the first manifest that contains one. */
export function extractProjectName(manifests: ManifestFile[]): string | null {
  for (const m of manifests) {
    const name = extractNameFromManifest(m);
    if (name) return name;
  }
  return null;
}

function extractNameFromManifest(manifest: ManifestFile): string | null {
  switch (manifest.type) {
    case "package.json":
    case "composer.json":
      return parseJsonName(manifest.content);

    case "Cargo.toml":
    case "pyproject.toml":
      return parseTomlName(manifest.content, manifest.type);

    case "go.mod":
      return parseGoModName(manifest.content);

    case "Gemfile":
    case "mix.exs":
    case "pom.xml":
    case "build.gradle":
    case "build.gradle.kts":
    case "CMakeLists.txt":
    case "Makefile":
    case "setup.py":
      // These require more complex parsing; return null for now
      return null;

    default:
      return null;
  }
}

function parseJsonName(content: string): string | null {
  try {
    const pkg = JSON.parse(content);
    return typeof pkg.name === "string" ? pkg.name : null;
  } catch {
    return null;
  }
}

function parseTomlName(content: string, type: string): string | null {
  try {
    const parsed = parseTOML(content);
    if (type === "Cargo.toml") {
      const pkg = parsed.package as Record<string, unknown> | undefined;
      return typeof pkg?.name === "string" ? pkg.name : null;
    }
    if (type === "pyproject.toml") {
      const project = parsed.project as Record<string, unknown> | undefined;
      return typeof project?.name === "string" ? project.name : null;
    }
    return null;
  } catch {
    return null;
  }
}

function parseGoModName(content: string): string | null {
  const match = content.match(/^module\s+(\S+)/m);
  if (!match) return null;
  // Extract the last segment of the module path
  const parts = match[1].split("/");
  return parts[parts.length - 1] || null;
}
