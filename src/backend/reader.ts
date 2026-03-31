import { resolve, basename } from "path";
import { access } from "fs/promises";
import { detectManifests, extractProjectName } from "./reader/manifests.js";
import { findReadme, buildFileTree } from "./reader/context.js";
import { packRepo } from "./reader/pack.js";
import type { ReaderResult } from "./reader/types.js";

export type { ReaderResult, ManifestFile } from "./reader/types.js";

export type ReadResult =
  | { ok: true; data: ReaderResult }
  | { ok: false; error: string };

/** Read a repo and collect structured context for LLM consumption. */
export async function readRepo(dir: string): Promise<ReadResult> {
  const repoRoot = resolve(dir);

  // Verify directory exists
  try {
    await access(repoRoot);
  } catch {
    return { ok: false, error: `Directory does not exist: ${repoRoot}` };
  }

  try {
    const [manifests, readme, fileTree, packResult] = await Promise.all([
      detectManifests(repoRoot),
      findReadme(repoRoot),
      buildFileTree(repoRoot),
      packRepo(repoRoot),
    ]);

    const name = extractProjectName(manifests) ?? basename(repoRoot);

    return {
      ok: true,
      data: {
        repoRoot,
        name,
        manifests,
        readme,
        fileTree,
        packedContent: packResult.content,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Failed to read repo: ${message}` };
  }
}
