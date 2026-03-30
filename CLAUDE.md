# docent

A CLI tool that reads any repository and produces a browser-based walk-through of it, written for someone who has never seen the code and doesn't know what it does.

You `cd` into a cloned repo and run `docent`. A browser opens. What you read should feel like someone knowledgeable sat down next to you and explained the project from scratch — not a README, not a reference doc, but a linear explanation that starts from a moment you've lived and ends with you understanding what the project does and why.

The reference for what this output should feel like is in `resources/Natural-Language-Processing.pdf`. Read the first two pages before touching any code.

---

## The Core Problem

When you clone an unfamiliar repo, you usually have nothing. Maybe a sparse README. Maybe nothing at all. You look at the file tree and it means little. You open a file and you're mid-conversation with no context.

The solution is not better documentation. The solution is a different kind of explanation — one that starts with the problem the project solves, not with how the project works.

---

## The Output

The output is a single HTML page that opens in the browser. It reads like an essay, not a reference doc. No sidebars, no navigation trees, no API tables.

It has two parts:

**Part 1: The Front Door**
This is the opening. It follows a strict structure:

1. A concrete scenario — a specific moment a real person would have lived — that makes the reader feel the problem the project solves before any explanation begins.
2. One sentence that names what the project does, written so a non-programmer can understand it.
3. A short walk-through of the primary use case: what you type, what happens, what you get back.

Part 1 should be completable in under two minutes of reading. When someone finishes it, they should be able to answer: "What does this project do, and when would I use it?"

**Part 2: The Other Doors** *(later development — do not build yet)*
After the front door, the reader can choose where to go next. Each additional concept or subsystem is its own door. The order is determined by importance to understanding the project, not by file structure or alphabetical order.

---

## The Generation Task (MVP)

The system reads a repo and produces Part 1.

To do this, it needs to answer four questions in order:

**1. What does this project do?**
Read the repo: entry point files, primary functions, CLI argument definitions, any existing README. Form a one-sentence answer in plain English.

**2. Who would use it, and when?**
Infer from the code's inputs and outputs. What kind of person would have this problem? What were they doing before they reached for this tool?

**3. What is the front door?**
Find the primary entry point — the one command, the one function, the one thing the author expected most users to do first. For a CLI tool, this is usually the main command with its most common arguments. For a library, it's the function imported first in example usage. For a web app, it's the primary user-facing action.

**4. What scenario puts the reader inside the problem?**
Write a two-to-four sentence scene. A specific person. A specific moment. A specific frustration or goal. No jargon. No explanation yet. The reader should recognize themselves in it before they know what the project is.

The output of answering these four questions is Part 1.

---

## The Writing Standard

Every line of generated explanation is held to one test: could a person who knows nothing about programming read this sentence and continue to the next one without stopping?

If a technical term is unavoidable, it must be defined the sentence it appears, using the thing itself as the definition — not an analogy, not a reference to something else.

The NLP doc does this with "vector": it doesn't say "a vector is like a list." It says "we assign it to a list of numbers, called a vector" and immediately shows why that matters. The term arrives after the reader already understands the concept.

Patterns to avoid are documented in `resources/AVOID.md`. Read it. The most common failure modes in generated explanation are listed there by name.

---

## What the MVP Is Not

- It is not a full codebase explainer. It covers the front door only.
- It is not interactive. The reader scrolls; they do not click through steps or answer questions.
- It does not require any input from the repo's author. It works on a cold clone.
- It does not try to explain every file or function. Depth comes later, through the other doors.

---

## Development Sequence

1. Build the repo reader: given a directory, identify the front door (entry point, primary command, main function).
2. Build the context inference: given the front door, answer the four questions above and produce structured output (not prose yet).
3. Build the writer: given the structured output, produce Part 1 as an HTML page.
4. Test on three real CLI repos of increasing complexity. Evaluate whether Part 1 passes the writing standard above.
5. Iterate on the writer prompt until the output reads like the NLP doc's opening, not like a README.

Do not move to Part 2 until Part 1 is passing consistently.

---

## Files

```
docent/
  resources/
    Natural-Language-Processing.pdf   # Reference for output quality
    AVOID.md                          # Writing anti-patterns to avoid
  src/
    reader.ts        # Repo ingestion and front door detection
    inference.ts     # Four-question context inference
    writer.ts        # Prose generation from structured context
    server.ts        # Local server that opens the browser
  cli.ts             # Entry point: `docent`
  CLAUDE.md          # This file
```

---

## The Test

When you run `docent` on a repo you've never seen, the output should make you feel, by the end of Part 1, that you understand what the project is for — without having opened a single source file yourself.

If you finish reading and you'd still have to open the code to answer "what does this do?", the output has failed.