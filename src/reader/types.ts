/** A manifest file found in the repo root */
export interface ManifestFile {
  /** Path relative to repo root (e.g., "package.json") */
  path: string;
  /** Raw file content */
  content: string;
  /** The manifest filename used as a type key */
  type: string;
}

/** The complete output of the reader module */
export interface ReaderResult {
  /** Absolute path of the repo root that was read */
  repoRoot: string;
  /** Project name extracted from manifest, or directory name as fallback */
  name: string;
  /** All detected manifest files with their contents */
  manifests: ManifestFile[];
  /** Raw README text, or null if none found */
  readme: string | null;
  /** File tree as relative paths, depth-limited, respecting .gitignore */
  fileTree: string[];
  /** Packed file contents for LLM consumption (from Repomix) */
  packedContent: string;
}
