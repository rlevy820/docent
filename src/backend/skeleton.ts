import type { ReaderResult } from "./reader/types.js";
import { callClaude } from "./client.js";

// --- Types ---

/**
 * A single stop on the builder's trail — one concept the reader needs to
 * understand, in the order they need to understand it.
 */
export interface TrailStop {
  /** The concept, in plain language. Not a file name. Not a technical label. */
  concept: string;
  /** One line: why this concept matters to someone who wants to build on this project. */
  why: string;
  /** One line: why this comes before the next stop. What it unlocks. */
  before: string;
}

/**
 * The skeleton — docent's point of view about how to walk a builder through
 * this codebase. Produced once, before any writing begins.
 */
export interface Skeleton {
  /**
   * How complex this codebase is. Determines how long the trail should be.
   * - small: one focused purpose, 3-5 trail stops
   * - medium: a few distinct concerns, 5-8 trail stops
   * - large: multiple moving parts, 8+ trail stops with sub-branches
   */
  size: "small" | "medium" | "large";
  /** One line: what this project does, in plain language, for someone who has never seen code. */
  what: string;
  /** The ordered trail a builder should walk, from first concept to last. */
  trail: TrailStop[];
}

// --- Prompt ---

interface PromptParts {
  system: string;
  user: string;
}

const CHARS_PER_TOKEN = 3;
const MAX_INPUT_TOKENS = 180_000;
const MAX_INPUT_CHARS = MAX_INPUT_TOKENS * CHARS_PER_TOKEN;

function buildSkeletonPrompt(reader: ReaderResult): PromptParts {
  const system = `You are preparing to walk a non-technical developer through a codebase. Your job right now is not to write the explanation — it is to plan it.

The reader is someone who is curious and intelligent but has never written code. They want to understand this project well enough to eventually add something to it. Not just understand it — build on it.

You are an expert software engineer and a patient teacher. Before you explain anything, you read the whole codebase and decide: what does this person need to understand, in what order, so that by the end they could contribute something of their own?

## Your Task

Produce a skeleton — a structural plan for the walk-through. Do not write any prose explanation yet. Just the plan.

### Step 1: Assess the size

Read the codebase and decide how complex it is:
- **small**: one focused purpose, does one thing well. 3-5 concepts to cover.
- **medium**: a few distinct concerns that work together. 5-8 concepts to cover.
- **large**: multiple moving parts, each substantial on its own. 8+ concepts to cover.

Base this on conceptual breadth — how many distinct things a builder would need to understand — not on file count or lines of code.

### Step 2: Write the what

One sentence. Plain language. What does this project do, described for someone who has never written code? No technical terms. No jargon. If you need a technical term, describe it instead.

### Step 3: Build the trail

An ordered list of concepts the reader should encounter, from first to last. Each stop on the trail is one concept — not a file, not a module, not a function. A concept.

For each stop:
- **concept**: what it is, in plain language
- **why**: one line on why it matters to someone who wants to build on this project
- **before**: one line on why it comes before the next stop — what it unlocks

The trail should be sized to match your assessment:
- small → 3-5 stops
- medium → 5-8 stops
- large → 8+ stops

The first stop is always the thing the reader needs to hold before anything else makes sense. Not the most technically central thing — the most *pedagogically* necessary thing. The concept that, once understood, makes everything that follows feel inevitable.

The last stop is the thing that completes builder-readiness — the concept that, once understood, means the reader could start contributing.

## Strict rules

1. **No file names.** Trail stops are concepts, not files.
2. **No technical terms in concept names unless unavoidable.** If unavoidable, the concept field should contain a plain-language description alongside the term.
3. **The trail is builder-oriented, not architect-oriented.** Order by what unlocks builder-readiness, not by what is structurally central.
4. **Do not invent concepts that aren't in the codebase.** Every stop on the trail should correspond to something real in the project.

## Output Format

{
  "size": "small" | "medium" | "large",
  "what": "one sentence, plain language, no jargon",
  "trail": [
    {
      "concept": "plain-language name for this concept",
      "why": "why this matters to a builder",
      "before": "what this unlocks for the next stop"
    }
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

export async function findSkeleton(reader: ReaderResult): Promise<Skeleton> {
  const prompt = buildSkeletonPrompt(reader);
  return callClaude<Skeleton>(prompt, undefined, 1024);
}
