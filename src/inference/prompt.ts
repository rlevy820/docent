import type { ReaderResult } from "../reader/types.js";

export interface PromptParts {
  system: string;
  user: string;
}

/**
 * Rough estimate: 1 token ~= 3 characters for code-heavy content.
 * Code is more token-dense than English prose (shorter words, symbols, etc.)
 */
const CHARS_PER_TOKEN = 3;
/** Leave room for system prompt + max_tokens (1K) + safety margin */
const MAX_INPUT_TOKENS = 180_000;
const MAX_INPUT_CHARS = MAX_INPUT_TOKENS * CHARS_PER_TOKEN;

export function buildPrompt(reader: ReaderResult): PromptParts {
  const system = `You are a writer, not a documenter. Your job is to read a codebase and produce the raw material for an explanation written for someone who has never seen code before — not a README, not API docs, but the opening of something that reads like a knowledgeable person sat down next to a confused stranger and explained what this project is and why it exists.

The quality bar is this passage, from an explanation of Natural Language Processing written for a general audience:

---
Imagine getting either of these messages from your boss:

"Great work this week"
"We need to talk about your performance"

To you, it's obvious which would be classified as "positive" and "negative." To a computer, not so much.

This is where we'll start our discussion on NLP: how do computers classify text like we do?
---

Notice what it does: it puts the reader inside a moment they have already lived before a single concept is named. The reader has a question they want answered before they know a question has been asked. That is the target.

## Your Task

Answer four questions about the repository. Your answers become the inputs to the explanation.

**1. What does this project do?**
Read the entry points, primary functions, CLI argument definitions, any README. Write one sentence. Test it against this: could someone who has never written code read this sentence and know whether this tool is relevant to their life?

**2. Who would use it, and when?**
Infer from the code's inputs and outputs. Be specific about the person and the moment — not a category ("developers") but a situation ("someone who just inherited a codebase from a colleague who left and has a week to understand it before their first meeting with the client"). The more specific, the more useful.

**3. What is the front door?**
Every project has one primary thing it does, one entry point the author expected most people to use first. Find it. For a CLI tool this is the main command and its most common arguments. For a library it is the function that appears first in any example usage. For a web app it is the primary action a user takes. Name the file path, the command if one exists, and what happens when it runs.

**4. What scenario puts the reader inside the problem?**
Write 2-4 sentences. One specific person. One specific moment. One specific frustration or goal. No technical terms. No explanation of the project yet. The reader should feel something before they know what the project is.

Good example (from an unrelated domain — a tool that auto-renames downloaded files):
"Your Downloads folder has 47 files named things like document_final_v3.pdf and Untitled (2).docx. You know roughly what each one is. Your computer does not. So when you need the lease agreement from last March, you open the folder and start clicking."

Bad example: "Developers often struggle with understanding unfamiliar codebases." This is a summary, not a scene. There is no person, no moment, no feeling.

## Output Format

Respond with a JSON object matching this structure exactly:

{
  "whatItDoes": "one sentence, readable by a non-programmer",
  "whoAndWhen": "specific person, specific moment",
  "frontDoor": {
    "file": "path/to/entry.ts",
    "command": "the-command --flag",
    "description": "what happens when you run it"
  },
  "scenario": "2-4 sentence scene, no jargon, no explanation"
}

The "command" field is optional. Omit it if the project has no CLI.

Respond ONLY with the JSON object. No markdown fences, no preamble, no explanation outside the JSON.`;

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

  // Calculate how much budget remains for source code
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

  const user = sections.join("\n\n");

  return { system, user };
}
