# docent

A tool that reads any code repository and produces a browser-based walk-through of it, written for someone who has never seen the code and doesn't know what it does.

You point it at a project. A browser opens. What you read should feel like someone knowledgeable walked you through the building — not handed you a blueprint, not pointed at a directory, but stood with you outside, showed you what it is, and then walked you through the doors that matter to you.

The reference for what this output should feel like is in `resources/Natural-Language-Processing.pdf`. Read the first two pages before touching any code.

---

## The Core Problem

When you encounter an unfamiliar codebase, you usually have nothing. Maybe a sparse README. Maybe nothing at all. You look at the file tree and it means little. You open a file and you're mid-conversation with no context.

The solution is not better documentation. The solution is a different kind of explanation — one that treats a codebase the way you'd treat a building you've never been inside.

---

## The Building

Everyone understands buildings. You can look at one from across the street and know roughly what it is — a house, a warehouse, a hospital. You can walk around it and see the sides, the doors, the loading dock. You can pick a door based on who you are — visitor, employee, maintenance — and each door leads you through the same building differently.

Code projects work the same way. They have an exterior (what it is and why it exists), sides you can see from outside (the commands, the inputs, the outputs), doors for different people (the person using it, the person building on it, the person maintaining it), and rooms inside (the parts and how they connect).

Docent's job is to walk someone through the building. Not hand them a floor plan. Walk them through it.

---

## The Output

The output is a single HTML page that opens in the browser. It reads like a walk-through, not a reference doc. No sidebars, no navigation trees, no API tables.

It follows a zoom sequence — the same way you'd approach a building you've never seen:

**1. The Exterior**
What is this building. Why does it exist. What kind of building is it — described in terms the reader already knows, not technical labels. A project that you type a command into and it does something for you is different from a project that other projects use as a building block, which is different from a project that runs constantly and waits for requests. The reader should understand which kind this is without needing a vocabulary lesson.

**2. The Sides and Doors**
What's visible from outside. What ways in exist. Each door is described by what you'd be doing when you'd use it — "if you want to use this tool, you go here; if you want to understand how it's built, you go here; if you want to change how it works, you go here." Not every project has every door. Some buildings only have one entrance. The reader should see what doors exist and know which one is theirs.

**3. The Visitor's Entrance**
The default path. What happens when you walk in as someone who just wants to use this thing. What you see first. What it does for you. This is the equivalent of the old "Part 1" — the front door walk-through — but now it exists inside the larger building, not as a standalone piece.

**4. The Map**
The rooms and why they exist. Not every room — the ones that matter for understanding the building. Each room arrives as the answer to a question the previous room raised. The reader should finish and feel like the architecture is obvious — "of course it works that way" — because each piece was the inevitable solution to a problem they already understood.

The reader can put on whichever hat fits. Some will only need the visitor's entrance. Some will want to understand the rooms. The structure accommodates both without forcing either.

---

## The Term Rule

The reader does not know what a CLI, an API, a library, a framework, a module, a function, a server, or a test suite is. Every technical concept must be described in plain language before it is named.

The NLP doc does this with "vector": it doesn't say "a vector is like a list." It says "we assign it to a list of numbers, called a vector" and immediately shows why that matters. The term arrives after the reader already understands the concept.

Docent must do the same for every piece of technical vocabulary. "A window on your computer you type commands into" comes before "command-line tool." "A collection of pieces of code other people use to build build new code on top of" comes before "library."

The description is the definition. The term is just a shorter name for something the reader already holds.

---

## The Generation Task

The system reads a repo and produces the walk-through.

To do this, the inference layer must answer these questions:

**1. What is this building and why was it built?**
What problem in the world may have caused someone to build this. One sentence, plain English, no jargon. A person who has never written code should be able to read it and know whether this project is relevant to their life.

**2. What kind of building is it?**
Not a label (CLI, library, service) but a plain-language description of how this kind of thing works. What does the person do with it? Do they type something and get a result? Do they plug it into something else they're building? Does it run on its own and wait? The description should make the kind obvious before any term is introduced.

**3. What are the sides — what's visible from outside?**
The surfaces someone can see before entering. For a command-based tool: the commands and what they accept. For a collection of building blocks: what pieces are available. For a running service: what it responds to. Described in terms of what a person would yeahsee and do, not technical interface descriptions.

**4. What doors exist and who are they for?**
Every way into the project, described by the relationship the person has to it. "If you want to use this, you start here." "If you want to understand how it's built, you start here." "If you want to change it, you start here." Not every project has all three. Some have one door.

**5. What happens when you walk through the visitor's door?**
The primary use case, step by step. What you do, what happens, what you get back. Written so someone who has never used a tool like this can follow it.

**6. What are the rooms and why does each one exist?**
The major parts of the project and how they relate. Each room should be described by the problem it solves, not by its technical name. The order matters: each room should answer a question that the previous room raised. The sequence should make the architecture feel inevitable.

**7. For every concept: what's the plain description and what's the technical term?**
Every technical term surfaced in answers 1-6 must have a paired plain-language description. The writer uses the description first, introduces the term after.

---

## The Writing Standard

Every line of generated explanation is held to one test: could a person who knows nothing about programming read this sentence and continue to the next one without stopping?

Patterns to avoid are documented in `resources/AVOID.md`. Read it before writing any prose generation code. The most common failure modes in generated explanation are listed there by name.

---

## The "Of Course" Test

When a reader finishes the walk-through, each piece of the project's architecture should feel like it was the obvious solution to a problem they already understood. If a component feels introduced rather than arrived at — if the reader's reaction is "okay, I guess that exists" instead of "of course, you'd need that" — the sequencing has failed.

This is the writer's real job: not formatting structured data into paragraphs, but finding the sequence where each piece arrives as an answer to a question the reader is already holding.

---

## What the MVP Is Not

- It is not interactive. The reader scrolls; they do not click through steps or answer questions.
- It does not require any input from the repo's author. It works on a cold clone.
- It does not try to explain every file or function. It explains the building well enough that the reader could look at the file tree afterward and have a rough sense of why each piece exists.

---

## Development Sequence

1. ~~Build the repo reader: given a directory, collect manifests, README, file tree, and packed source.~~ Done.
2. Build the inference layer: given the reader output, answer the seven questions above and produce structured output (not prose yet).
3. Build the writer: given the structured output, produce the walk-through as an HTML page.
4. Build the server: serve the HTML and open the browser.
5. Wire everything together as the `docent` command.
6. Test on real repos of increasing complexity. Evaluate whether the output passes the writing standard and the "of course" test.

---

## Files

```
docent/
  resources/
    Natural-Language-Processing.pdf   # Reference for output quality
    AVOID.md                          # Writing anti-patterns to avoid
  src/
    reader.ts                         # Public API: readRepo(dir) -> ReadResult
    reader/
      types.ts                        # ReaderResult, ManifestFile interfaces
      manifests.ts                    # Manifest detection + project name extraction
      context.ts                      # README finder, file tree builder
      pack.ts                         # Repomix integration for packing source
    inference.ts                      # Public API: infer(readerResult) -> InferenceResult
    inference/
      types.ts                        # InferenceResult and supporting interfaces
      prompt.ts                       # Builds system + user prompt from reader output
      client.ts                       # Anthropic API client wrapper
    writer.ts                         # (not built yet) Prose generation from structured context
    server.ts                         # (not built yet) Local server that opens the browser
    cli.ts                            # (not built yet) Entry point: `docent`
  test/
    reader/                           # Unit tests for reader module
    inference/                        # Unit tests for inference module
    fixtures/                         # Minimal fake repos for testing
    manual-check.ts                   # Run reader on any repo with progress logs
    manual-inference.ts               # Run reader + inference on any repo (calls API)
  CLAUDE.md                           # This file
```

---

## Current Status

### Done
- **Reader module**: Takes any directory, returns manifests, README, file tree, and Repomix-packed source. Language-agnostic. Filters binary files from tree. 23 tests.

### Needs Rework
- **Inference module**: Currently answers four questions (whatItDoes, whoAndWhen, frontDoor, scenario). Needs to be expanded to answer the seven questions above — the building exterior, the doors, the rooms, and the term pairs.

### Not Built Yet
- **Writer module**: Takes inference output, produces the walk-through as HTML.
- **Server module**: Serve the HTML and open the browser.
- **CLI**: Wire everything together as `docent` command.

### Dependencies
- `repomix` — repo packing (file tree, .gitignore, source collection)
- `smol-toml` — TOML manifest parsing
- `@anthropic-ai/sdk` — Claude API calls
- `dotenv` — .env file loading
- `vitest` / `tsx` / `typescript` — dev tooling

---

## The Test

When you run `docent` on a repo you've never seen, the output should make you feel like you understand the building — what it is, why it exists, how to walk through it, and why the rooms are where they are.

If you finish reading and the architecture doesn't feel inevitable — if the pieces feel listed rather than arrived at — the output has failed.