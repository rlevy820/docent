import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";
import type { InferenceResult } from "./types.js";
import type { PromptParts } from "./prompt.js";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function callClaude(
  prompt: PromptParts,
  model: string = DEFAULT_MODEL,
): Promise<InferenceResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  try {
    return JSON.parse(textBlock.text) as InferenceResult;
  } catch {
    throw new Error(
      `Failed to parse Claude response as JSON. Raw response:\n${textBlock.text.slice(0, 500)}`,
    );
  }
}
