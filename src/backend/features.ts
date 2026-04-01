import type { ReaderResult } from "./reader/types.js";
import type { Walkthrough } from "./walkthrough.js";
import { callClaude } from "./client.js";

// --- Types ---

/**
 * A single feature — something the software literally does.
 * Features belong to one of two layers:
 * - "user": what the person using the software does with it
 * - "code": what the code does internally to make that happen
 */
export interface Feature {
  /** Unique identifier — used to embed this feature as a link in the intro sentence */
  id: string;
  /** Plain-English name as it appears in the intro sentence. A short action phrase. */
  name: string;
  /** The section content from the first draft most relevant to this feature */
  detail: string;
}

export interface FeatureList {
  /**
   * One sentence describing what the person using this software does with it.
   * Feature ids are embedded as {id} placeholders — e.g. "Docent lets you {point-at-folder} and {read-explanation}."
   * Max 3 features. No technical terms. Written for someone who has never written code.
   */
  userSentence: string;
  /**
   * One sentence describing how the code makes that happen.
   * Feature ids are embedded as {id} placeholders — e.g. "To do that, it {reads-code}, {plans-explanation}, and {serves-walkthrough}."
   * Max 3 features. Plain English. No jargon — if a term is unavoidable, describe it instead.
   */
  codeSentence: string;
  /** All features from both sentences, keyed by id */
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
  const draftText = walkthrough.sections
    .map((s, i) => `[Section ${i + 1}]\n${s.content}`)
    .join("\n\n");

  const system = `You are extracting a structured feature summary from a written explanation of a software project.

Your output has two parts: two intro sentences and the features embedded in them.

---

## What a feature is

A feature is something the software literally does. Not what someone could build with it. Not a benefit. Not an outcome. Not a creative application.

The test: can you point to where in the codebase this happens? If yes, it is a feature. If it is an inference about what someone might do with it, it is not.

Good features:
- "point it at any code folder"
- "read a plain-English explanation"
- "reads and packs the code"
- "plans the explanation"
- "serves it to your browser"

Not features:
- "helps you understand complex projects faster" — benefit
- "you could use this to onboard new teammates" — creative application
- "makes code accessible" — outcome
- "powerful code analysis" — marketing language

---

## The two sentences

### Sentence 1: What the user does (userSentence)

One sentence. Describes what the person using this software does with it — from their perspective, not the code's. Written for someone who has never written code. No technical terms. No jargon.

If a word like "backend" or "frontend" or "API" would appear, replace it with a plain description: "the part you see in the browser" not "the frontend", "the part that runs on the server" not "the backend."

Embed up to 3 features as {id} placeholders. The feature names should read naturally as part of the sentence.

Example: "Docent lets you {point-at-folder} and get back a {read-explanation} of what it does."

### Sentence 2: How the code does it (codeSentence)

One sentence. Describes what the code does internally to make the user-facing thing happen. One level deeper than the first sentence — this is for the builder who wants to know where to put their hands.

Still plain English. Still no jargon. If a technical concept is unavoidable, describe it before naming it.

Embed up to 3 features as {id} placeholders.

Example: "To do that, it {reads-packs-code}, {plans-explanation}, and {writes-serves} it to your browser."

---

## Rules

1. Max 3 features per sentence (6 total across both sentences).
2. Every {id} in a sentence must have a matching feature in the features array.
3. Feature names must read naturally as part of their sentence — they are link text, not headings.
4. Detail for each feature comes from the first draft. Do not write new content — pull the most relevant passage.
5. Be conservative. A small tool might have 2 features per sentence. Do not inflate.
6. The two sentences together should give a reader a complete picture of what the software is and how it works.

---

## Output Format

{
  "userSentence": "one sentence with {id} placeholders",
  "codeSentence": "one sentence with {id} placeholders",
  "features": [
    {
      "id": "kebab-case-id",
      "name": "plain-English phrase as it appears in the sentence",
      "detail": "the most relevant passage from the first draft"
    }
  ]
}

Respond ONLY with the JSON object. No markdown fences, no preamble.`;

  const user = `Project name: ${reader.name}
Project summary: ${walkthrough.what}

## First Draft

${draftText}`;

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
