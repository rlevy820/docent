import type { ReaderResult } from "./reader/types.js";
import type { InferenceResult } from "./inference/types.js";
import { buildPrompt } from "./inference/prompt.js";
import { callClaude } from "./inference/client.js";

export type { InferenceResult } from "./inference/types.js";

export async function infer(reader: ReaderResult): Promise<InferenceResult> {
  const prompt = buildPrompt(reader);
  return callClaude(prompt);
}
