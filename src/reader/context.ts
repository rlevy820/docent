import { readFile, readdir } from "fs/promises";
import { join, relative, extname } from "path";
import ignore from "ignore";

const README_NAMES = ["README.md", "README", "readme.md", "README.rst", "README.txt"];

/** Binary/non-source extensions to exclude from the file tree */
const BINARY_EXTENSIONS = new Set([
  // Images
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".webp", ".tiff", ".tif",
  // Audio/Video
  ".mp3", ".mp4", ".wav", ".avi", ".mov", ".flac", ".ogg", ".webm",
  // Compiled/Binary
  ".exe", ".dll", ".so", ".dylib", ".o", ".a", ".class", ".pyc", ".wasm",
  // Archives
  ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar", ".jar",
  // Data/DB
  ".npz", ".npy", ".h5", ".hdf5", ".sqlite", ".db", ".parquet",
  // Fonts
  ".ttf", ".otf", ".woff", ".woff2", ".eot",
  // Other
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".pbxproj",
]);

/** Always exclude these directories regardless of .gitignore */
const ALWAYS_EXCLUDE = new Set([
  ".git",
  "node_modules",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  ".next",
  ".nuxt",
]);

/** Find and read the first README file that exists. */
export async function findReadme(repoRoot: string): Promise<string | null> {
  for (const name of README_NAMES) {
    try {
      const content = await readFile(join(repoRoot, name), "utf-8");
      return content;
    } catch {
      // Not found, try next
    }
  }
  return null;
}

/**
 * Build a flat list of relative file paths in the repo,
 * respecting .gitignore and excluding common non-source directories.
 */
export async function buildFileTree(
  repoRoot: string,
  maxDepth: number = 4,
): Promise<string[]> {
  // Load .gitignore if it exists
  const ig = ignore();
  try {
    const gitignoreContent = await readFile(join(repoRoot, ".gitignore"), "utf-8");
    ig.add(gitignoreContent);
  } catch {
    // No .gitignore, proceed without it
  }

  const results: string[] = [];

  async function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (ALWAYS_EXCLUDE.has(entry.name)) continue;

      const fullPath = join(dir, entry.name);
      const relPath = relative(repoRoot, fullPath).split("\\").join("/");

      // Check .gitignore — ignore expects paths with trailing / for directories
      const checkPath = entry.isDirectory() ? relPath + "/" : relPath;
      if (ig.ignores(checkPath)) continue;

      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else {
        if (BINARY_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;
        results.push(relPath);
      }
    }
  }

  await walk(repoRoot, 0);
  return results.sort();
}
