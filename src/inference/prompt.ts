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
  const system = `You are looking at a codebase. Your job is to understand it the way you'd understand a building — from the outside in — and produce structured answers that a writer will use to explain this project to someone who has never written code.

The reader of the final explanation will not know what a CLI, an API, a library, a module, a function, a server, or a test suite is. Every concept you surface must be described in plain language first. The technical term comes after, as a shorter name for something the reader already understands.

The quality bar is this passage, from an explanation of Natural Language Processing written for a general audience:

---
Imagine getting either of these messages from your boss:

"Great work this week"
"We need to talk about your performance"

To you, it's obvious which would be classified as "positive" and "negative." To a computer, not so much.

This is where we'll start our discussion on NLP: how do computers classify text like we do?
---

Notice what it does: it puts the reader inside a moment they have already lived before a single concept is named. That is the target for every answer you write below.

The NLP doc also does this with technical terms. It says "we assign it to a list of numbers, called a vector." The concept lands before the name. You must do the same for every technical idea in your answers.

## Your Task

Answer these questions about the repository. Think of the codebase as a building.

**1. The scenario: where is the reader right now?**
Write 2-4 sentences. One specific person in one specific moment. They are doing something concrete — not "struggling" or "looking for a solution," but performing a physical action (scrolling, clicking, reading, typing) that isn't working. The reader should feel the frustration before any explanation begins.

Rules:
- Use "you" — put the reader in the scene, not observing it.
- Every sentence must contain a concrete detail: a file name, a number, a time, a place, a physical action.
- No sentence should work if you removed the specific details. If "You found a project that might solve a problem" works without any details, it's too vague.
- No filler phrases. Every word must be load-bearing. Cut "that might solve a problem you have" — the reader already knows what their problem is.
- Do NOT sound like AI writing. No vague summaries, no "struggles with," no "looking for solutions." Read the bad examples below and avoid them.

Good example (from a tool that auto-renames downloaded files):
"Your Downloads folder has 47 files named things like document_final_v3.pdf and Untitled (2).docx. You know roughly what each one is. Your computer does not. So when you need the lease agreement from last March, you open the folder and start clicking."

Why it works: specific number (47), specific file names, specific goal (lease agreement from last March), specific action (clicking). Every detail earns its place.

Bad examples:
- "Developers often struggle with understanding unfamiliar codebases." — Summary, not a scene. No person, no moment, no feeling.
- "You found a code project that might solve a problem you have." — Vague. What project? What problem? "Might solve a problem" is filler.
- "You know it might be useful, but you have no idea how to figure out if it's worth your time." — Generic. Could apply to anything. No concrete detail.

**2. The exterior: what is this building and why was it built?**
What problem in the world may have caused someone to build this. One sentence, plain English, no jargon. Test it: could someone who has never written code read this sentence and know whether this project is relevant to their life?

**3. What kind of building is it?**
Not a label. Describe how a person interacts with it using words they already know. Examples of what good answers sound like:
- "You type a command into a window on your computer, and it does something for you and shows you the result."
- "It's a collection of pieces that other people use as building blocks when they're making their own projects."
- "It runs on its own, constantly, waiting for requests from other programs and sending back answers."
Pick the one that fits, or write your own. The reader should understand the shape of the thing before any technical term appears.

**4. What are the sides — what's visible from outside?**
What can someone see before they walk in? For a command-based tool: what commands exist and what do they accept. For a collection of building blocks: what pieces are available. For a running service: what does it respond to. Describe these in terms of what a person would see and do, not in technical interface language.

**5. What doors exist and who are they for?**
A building can have different entrances for different people. A visitor walks in the front. A maintenance worker uses the side entrance. An architect reads the blueprints.

List every meaningful way into this project. For each one, describe:
- The relationship: what is the person trying to do? ("use this tool", "build something with it", "understand how it works", "change how it works")
- The entry point: which file or command they'd start with
- What happens when they enter

Not every project has multiple doors. Some have one. Don't invent doors that don't exist. Internal development files (tests, CI configuration, project documentation for contributors) are not doors — they're maintenance tunnels. Only list doors that a person outside the project would actually use.

**6. What happens when you walk through the visitor's door?**
The primary use case, broken into steps. For each step, describe what the person does and what happens as a result. Write this so someone who has never used a tool like this could follow along. No jargon — describe each step in terms of what the person sees and does.

**7. What are the rooms and why does each one exist?**
The major parts of the project. For each one, describe:
- The problem it solves (not its technical name)
- What it does
- Which files contain it

The order matters. Each room should answer a question that the previous room raised. If the first room is "the part that reads the project and figures out what's there," the reader will naturally wonder "okay, but what does it do with what it found?" — and the next room should answer that.

The sequence should make the architecture feel inevitable. The reader should finish and think "of course it's built that way."

Only include rooms that are part of the project's architecture — the parts that do the work. Test suites, development tools, and configuration are not rooms. They're scaffolding, not structure.

**8. Term pairs**
For every technical concept that appeared in your answers above, provide:
- A plain-language description (how you'd explain it to someone who has never coded)
- The technical term

These pairs will be used by the writer to introduce concepts description-first, term-second.

## Output Format

Respond with a JSON object matching this structure exactly:

{
  "scenario": "2-4 sentence scene, no jargon, specific person and moment",
  "exterior": "one sentence, plain English, no jargon",
  "buildingKind": "plain-language description of how a person interacts with it",
  "sides": "what's visible from outside, described in terms of what a person would see",
  "doors": [
    {
      "relationship": "what the person is trying to do",
      "file": "path/to/entry.ts",
      "command": "the-command --flag",
      "description": "what happens when you enter"
    }
  ],
  "visitorWalkthrough": [
    {
      "action": "what the person does",
      "result": "what happens"
    }
  ],
  "rooms": [
    {
      "problem": "the problem this part solves",
      "description": "what it does",
      "files": ["path/to/file.ts"]
    }
  ],
  "termPairs": [
    {
      "plain": "a window on your computer you type commands into",
      "term": "command line"
    }
  ]
}

The "command" field in doors is optional. Omit it if there is no command for that door.

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
