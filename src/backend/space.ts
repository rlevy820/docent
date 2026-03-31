import type { ReaderResult } from "./reader/types.js";
import { callClaude } from "./client.js";

// --- Types ---

/** A door leading out of a space — a natural next question the reader might have */
export interface Door {
  /** The link text — a question or phrase that names where this door leads */
  label: string;
}

/** A space in the walkthrough — 1-3 sentences of content and doors to deeper spaces */
export interface Space {
  /** The explanation for this space — 1-3 sentences, plain language, no jargon */
  content: string;
  /** Doors out of this space — natural next questions that emerge from the content */
  doors: Door[];
}

// --- Prompt ---

interface PromptParts {
  system: string;
  user: string;
}

const CHARS_PER_TOKEN = 3;
const MAX_INPUT_TOKENS = 180_000;
const MAX_INPUT_CHARS = MAX_INPUT_TOKENS * CHARS_PER_TOKEN;

export function buildPrompt(reader: ReaderResult, path: Space[]): PromptParts {
  const isRoot = path.length === 0;

  const pathText = path.length > 0
    ? path.map((s, i) => `[Space ${i + 1}]\n${s.content}`).join("\n\n")
    : null;

  const system = `You are explaining a codebase to a developer who wants to understand it well enough to work on it — but you are explaining it as if they were an average non-technical person who has never written code. Write for the layman. The developer benefits because plain, incremental explanations build understanding faster than jargon-heavy overviews. They have been plopped in front of this explanation and have read only what the system has shown them so far. They know nothing else beyond what is written below.

${pathText
    ? `Here is everything the reader has been told, in order:\n\n---\n${pathText}\n---\n\nThat is the entirety of what they know. If a concept was not in the text above, they do not know it.`
    : "The reader has not been told anything yet. This is the very first thing they will see."}

The quality bar is this passage, from an explanation of Natural Language Processing written for a general audience:

---
Imagine getting either of these messages from your boss:

"Great work this week"
"We need to talk about your performance"

To you, it's obvious which would be classified as "positive" and "negative." To a computer, not so much.
---

Notice: plain language, no jargon, every sentence earns its place.

## Your Task

Produce the next space in the walkthrough.

**Content**: Write 1-3 sentences.${isRoot
    ? ` This is the root space — the first thing the reader sees. Place the building: what world does this project exist in, and what does it do in that world. If the project depends on hardware, a platform, or a service the reader might not know about, establish that first.`
    : ` Build incrementally from what the reader already knows. Each sentence should introduce exactly one new idea that follows naturally from the previous one. Do not repeat what has already been said.`}

## Strict language rules

These are hard constraints. Violating any of them means the output has failed.

1. **No technical terms unless you explained them first.** "Bluetooth", "FastAPI", "backend", "API", "server", "streaming", "AI model" — none of these can appear unless you have already explained what they are in plain language, either in a previous space or earlier in this space. If the reader hasn't been told what something is, you cannot use the word.

2. **No product names or brand names for technical concepts.** Don't say "Meta Ray-Ban glasses" — say "glasses with a camera and microphone built in." The reader doesn't need brand names to understand how the building works.

3. **No product-description language.** Don't say "a smart glasses assistant" or "the system." Describe what happens in plain terms: "the glasses watch for faces" not "the face recognition system processes video input."

4. **Before introducing any new concept, ask: does the reader know every word in this sentence?** If the answer is no, you need to explain the unknown words first, or use different words entirely.

5. **No invented metaphors or analogies.** Do not say "it's like a filing system" or "think of it as bubbles connected by lines." Describe what actually happens, then name it. The NLP doc says "we assign it to a list of numbers, called a vector" — it does not say "think of it like a secret code." Describe the real thing plainly.

6. **No "imagine."** These are real things, not thought experiments. Describe what exists, not what to picture.

7. **No AI writing patterns.** No "It's not X, it's Y", no tricolons, no grandiose stakes, no rhetorical questions answered immediately.

**Doors**: List the natural next questions that emerge from what you just wrote. These are doors the reader can walk through to go deeper. Each door label should be a short phrase or question — something the reader would actually think after reading your content.

Rules for doors:
- Only create doors for questions your content actually raises. Do not invent doors for completeness.
- 1-4 doors. Most spaces have 1-2.
- If there is nothing more to explain at this depth, return an empty doors array.
- Door labels should be plain language, not section titles. "How does it know who you're looking at?" not "Face Recognition Module."

## Output Format

{
  "content": "1-3 sentences, plain language",
  "doors": [
    { "label": "a natural next question" }
  ]
}

Respond ONLY with the JSON object. No markdown fences, no preamble.`;

  return { system, user: buildUserMessage(reader, system) };
}

function buildUserMessage(reader: ReaderResult, system: string): string {
  const sections: string[] = [];

  sections.push(`Project name: ${reader.name}`);

  if (reader.readme) {
    sections.push(`## README\n\n${reader.readme}`);
  } else {
    sections.push(`## README\n\nNo README found.`);
  }

  if (reader.manifests.length > 0) {
    const manifestSection = reader.manifests
      .map((m) => `### ${m.type}\n\n${m.content}`)
      .join("\n\n");
    sections.push(`## Manifest Files\n\n${manifestSection}`);
  }

  sections.push(`## File Tree\n\n${reader.fileTree.join("\n")}`);

  const preamble = sections.join("\n\n");
  const sourceHeader = "## Source Code\n\n";
  const charsUsed = system.length + preamble.length + sourceHeader.length;
  const charsRemaining = MAX_INPUT_CHARS - charsUsed;

  if (charsRemaining > 0) {
    if (reader.packedContent.length <= charsRemaining) {
      sections.push(`${sourceHeader}${reader.packedContent}`);
    } else {
      const truncated = reader.packedContent.slice(0, charsRemaining);
      sections.push(
        `${sourceHeader}${truncated}\n\n[Source truncated to fit context window. The file tree above is complete.]`,
      );
    }
  }

  return sections.join("\n\n");
}

// --- Public API ---

export async function generateSpace(
  reader: ReaderResult,
  path: Space[] = [],
): Promise<Space> {
  const prompt = buildPrompt(reader, path);
  return callClaude<Space>(prompt, undefined, 1024);
}
