import type { ReaderResult } from "./reader/types.js";
import type { Skeleton, TrailStop } from "./skeleton.js";
import { callClaude } from "./client.js";

// --- Types ---

/** A single written section of the walk-through */
export interface Section {
  /** The prose — a few paragraphs of plain-language explanation */
  content: string;
  /** What comes next */
  next: NextStep;
}

/** The section writer's decision about what to do after this section */
export type NextStep =
  | { action: "deeper" }   // go deeper into the current trail stop
  | { action: "forward" }  // move to the next stop on the trail
  | { action: "stop" };    // the walk-through is complete

// --- Prompt ---

interface PromptParts {
  system: string;
  user: string;
}

const CHARS_PER_TOKEN = 3;
const MAX_INPUT_TOKENS = 180_000;
const MAX_INPUT_CHARS = MAX_INPUT_TOKENS * CHARS_PER_TOKEN;

function buildSectionPrompt(
  reader: ReaderResult,
  skeleton: Skeleton,
  currentStop: TrailStop,
  stopIndex: number,
  sections: Section[],
): PromptParts {
  const isFirst = sections.length === 0;
  const isLastStop = stopIndex === skeleton.trail.length - 1;
  const nextStop = !isLastStop ? skeleton.trail[stopIndex + 1] : null;

  const priorText = sections.length > 0
    ? sections.map((s, i) => `[Section ${i + 1}]\n${s.content}`).join("\n\n")
    : null;

  const trailText = skeleton.trail
    .map((stop, i) => {
      const marker = i < stopIndex ? "✓" : i === stopIndex ? "→" : " ";
      return `${marker} ${i + 1}. ${stop.concept}`;
    })
    .join("\n");

  const system = `You are writing a walk-through of a codebase for a non-technical developer who wants to understand it well enough to build on it. You write for the layman — someone who is curious and intelligent but has never written code.

You are not writing a reference document. You are not listing features. You are walking someone through a building they have never been inside, in an order that makes the building make sense.

## The trail

The walk-through follows this trail of concepts, in order:

${trailText}

You are currently at: **${currentStop.concept}**
Why it matters to a builder: ${currentStop.why}
${nextStop ? `What it unlocks for the next stop: ${currentStop.before}` : "This is the final stop."}

## What the reader already knows

${priorText
    ? `Here is everything the reader has been told so far, in order:\n\n---\n${priorText}\n---\n\nThat is the entirety of what they know. If a concept was not in the text above, they do not know it.`
    : "The reader has not been told anything yet. This is the very first thing they will see."}

## The quality bar

This passage, from an explanation of Natural Language Processing written for a general audience:

---
Imagine getting either of these messages from your boss:

"Great work this week"
"We need to talk about your performance"

To you, it's obvious which would be classified as "positive" and "negative." To a computer, not so much.
---

Plain language. No jargon. Every sentence earns its place.

## Your Task

Write the next section of the walk-through, covering the current trail stop.

**Content**: Write 2-5 sentences.${isFirst
    ? ` This is the first thing the reader sees. Start from the outside of the building: what world does this project exist in, and what does it do in that world. The reader knows nothing yet.`
    : ` Build on what the reader already knows. Each sentence should introduce exactly one new idea that follows naturally from the previous one. Do not repeat what has already been said.`}

The goal of this section is to bring the reader to the point where **${currentStop.concept}** feels clear and useful to them — not just understood, but felt as something they could touch.

## Strict language rules

These are hard constraints. Violating any of them means the output has failed.

1. **No technical terms unless you explained them first.** If the reader hasn't been told what something is, you cannot use the word. If a term is unavoidable, describe it in plain language before naming it.

2. **No product names or brand names for technical concepts.** Describe what the thing does, not what it is called.

3. **No product-description language.** No "the system", no "smart assistant", no "powerful tool." Describe what happens in plain terms.

4. **Before introducing any new concept, ask: does the reader know every word in this sentence?** If the answer is no, explain the unknown words first, or use different words entirely.

5. **No invented metaphors or analogies.** Describe what actually happens, then name it. The NLP doc says "we assign it to a list of numbers, called a vector" — it does not say "think of it like a secret code."

6. **No "imagine."** These are real things. Describe what exists.

7. **No AI writing patterns.** No "It's not X, it's Y", no tricolons, no grandiose stakes, no rhetorical questions answered immediately.

## After writing: decide what comes next

Once you have written the section, decide what the walk-through should do next. Choose one:

- **deeper**: the reader needs more on this concept before they are ready to move on. There is something important about **${currentStop.concept}** that this section did not cover and that a builder would need.
- **forward**: the reader now understands **${currentStop.concept}** well enough. Move to the next stop: ${nextStop ? `**${nextStop.concept}**` : "_(no next stop — use stop instead)_"}.
- **stop**: the walk-through is complete. The reader has everything they need to start contributing.${isLastStop ? " This is the last stop on the trail, so stop unless the current section left something critical uncovered." : ""}

Choose **stop** only when the reader genuinely has builder-readiness — not just comprehension.

## Output Format

{
  "content": "the section prose",
  "next": { "action": "deeper" | "forward" | "stop" }
}

Respond ONLY with the JSON object. No markdown fences, no preamble.`;

  return { system, user: buildUserMessage(reader, skeleton, system) };
}

function buildUserMessage(reader: ReaderResult, skeleton: Skeleton, system: string): string {
  const sections: string[] = [];

  sections.push(`Project name: ${reader.name}`);
  sections.push(`Project summary: ${skeleton.what}`);

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

export async function generateSection(
  reader: ReaderResult,
  skeleton: Skeleton,
  currentStop: TrailStop,
  stopIndex: number,
  sections: Section[] = [],
): Promise<Section> {
  const prompt = buildSectionPrompt(reader, skeleton, currentStop, stopIndex, sections);
  return callClaude<Section>(prompt, undefined, 1024);
}
