import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

interface PromptParts {
  system: string;
  user: string;
}

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function callClaude<T>(
  prompt: PromptParts,
  model: string = DEFAULT_MODEL,
  maxTokens: number = 4096,
): Promise<T> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: prompt.system,
    messages: [
      { role: "user", content: prompt.user },
      { role: "assistant", content: "{" },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Prepend the "{" we used as a prefill
  const raw = ("{" + textBlock.text).trim();

  // Extract the JSON object
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `No JSON object found in Claude response. Raw response:\n${raw.slice(0, 500)}`,
    );
  }

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    throw new Error(
      `Failed to parse Claude response as JSON. Raw response:\n${raw.slice(0, 500)}`,
    );
  }
}
