import { readFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { runCli, type CliOptions } from "repomix";

export interface PackResult {
  /** The full packed content as a string */
  content: string;
  /** Number of files included */
  totalFiles: number;
  /** Estimated token count */
  totalTokens: number;
}

/** Pack a repo directory into a single string for LLM consumption. */
export async function packRepo(repoRoot: string): Promise<PackResult> {
  const outputPath = join(tmpdir(), `docent-pack-${Date.now()}.xml`);

  try {
    const options = {
      output: outputPath,
      style: "xml",
      quiet: true,
    } as CliOptions;

    const result = await runCli([repoRoot], repoRoot, options);
    const content = await readFile(outputPath, "utf-8");

    return {
      content,
      totalFiles: result.packResult.totalFiles,
      totalTokens: result.packResult.totalTokens,
    };
  } finally {
    await rm(outputPath, { force: true });
  }
}
