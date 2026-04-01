import type { ReaderResult } from "./reader/types.js";
import type { Walkthrough } from "./walkthrough.js";
import { callClaude } from "./client.js";

// --- Types ---

/** A single feature — something the software literally does */
export interface Feature {
  /** Plain-English name. A short action phrase. "Read a local codebase." Not "Codebase Reader." */
  name: string;
  /** One sentence. What the user can do with this feature right now. No creative applications, no benefits, no outcomes. */
  description: string;
  /** The section content from the first draft most relevant to this feature */
  detail: string;
}

export interface FeatureList {
  features: Feature[];
}

// --- Prompt ---

interface PromptParts {
  system: string;
  user: string;
}

function buildFeaturesPrompt(
  reader: ReaderResult,
  walkthrough: Walkthrough,
): PromptParts {
  const drafText = walkthrough.sections
    .map((s, i) => `[Section ${i + 1}]\n${s.content}`)
    .join("\n\n");

  const system = `You are extracting a feature list from a written explanation of a software project.

A feature is something the software literally does. Not what someone could build with it. Not a benefit. Not an outcome. Not a creative application.

The test: can you point to where in the codebase this happens? If yes, it is a feature. If it is an inference about what someone might do with it, it is not.

## Examples of features
- "Read a local folder of code"
- "Generate a plain-English explanation of a codebase"
- "Open the explanation in a browser"

## Examples of what are NOT features
- "Helps you understand complex projects faster" — this is a benefit
- "You could use this to onboard new teammates" — this is a creative application
- "Makes code accessible to non-technical people" — this is an outcome
- "Powerful code analysis" — this is marketing language

## Your Task

Read the first draft walk-through below and extract the features — the things this software literally does.

Rules:
1. **Only real features.** If it is not something the software actually does right now, do not include it.
2. **Plain English names.** Short action phrases. "Read a local codebase." Not "Codebase Reading Module."
3. **No jargon.** If a technical term is unavoidable, describe it in plain language instead.
4. **No benefits, outcomes, or creative applications.** Only what the software does.
5. **Be conservative.** A small tool might have 3 features. Do not inflate the list. Only include features that are distinct and real.
6. **Detail comes from the first draft.** For each feature, pull the most relevant passage from the first draft that explains it. Do not write new content — use what is already there.

## Output Format

{
  "features": [
    {
      "name": "short action phrase",
      "description": "one sentence — what the user can do with this right now",
      "detail": "the most relevant passage from the first draft"
    }
  ]
}

Respond ONLY with the JSON object. No markdown fences, no preamble.`;

  const user = `Project name: ${reader.name}
Project summary: ${walkthrough.what}

## First Draft

${drafText}`;

  return { system, user };
}

// --- Public API ---

export async function extractFeatures(
  reader: ReaderResult,
  walkthrough: Walkthrough,
): Promise<FeatureList> {
  const prompt = buildFeaturesPrompt(reader, walkthrough);
  return callClaude<FeatureList>(prompt, undefined, 1024);
}
