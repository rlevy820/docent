# docent

A tool that reads any code repository and produces a browser-based walk-through of it, written for someone who has never seen the code and doesn't know what it does.

You point it at a project. A browser opens. What you read should feel like someone knowledgeable walked you through the building — not handed you a blueprint, not pointed at a directory, but stood with you outside, showed you what it is, and then walked you through every room in the right order.

The reference for what this output should feel like is in `resources/Natural-Language-Processing.pdf`. Read the first two pages before touching any code.

---

## The Core Problem

When you encounter an unfamiliar codebase, you usually have nothing. Maybe a sparse README. Maybe nothing at all. You look at the file tree and it means little. You open a file and you're mid-conversation with no context.

The solution is not better documentation. The solution is a different kind of explanation — one that treats a codebase the way you'd treat a building you've never been inside.

---

## The Building

Everyone understands buildings. You can look at one from across the street and know roughly what it is — a house, a warehouse, a hospital. You can walk around it and see the sides. You can walk inside and someone who knows the building can take you through it — showing you the main hall first, then the wings that branch off it, in whatever order makes the building make sense.

Code projects work the same way. They have an exterior (what it is and why it exists), surfaces you can see from outside (the commands, the inputs, the outputs), a trunk (the central concept everything else hangs off of), and branches (the parts that connect to the trunk and to each other).

Docent's job is to walk someone through the building. Not hand them a floor plan. Not give them a menu of rooms to choose from. Walk them through it, in order, with a point of view about what matters and why.

---

## The Point of View

Docent is not interactive. The reader does not choose where to go next. Docent decides the order — the same way a knowledgeable guide decides which room to show you first, because they know which room makes all the other rooms make sense.

This is the key design principle: **docent has a point of view.** It reads the codebase, finds the trunk — the single concept everything else hangs off of — and builds the walk-through outward from there. The reader just follows.

The NLP reference doc works this way. It doesn't ask the reader "what do you want to learn about next?" It just goes — because the author knows the ordering. You can't understand TF-IDF without first understanding bag-of-words, and you can't understand cosine similarity without first understanding vectors. The author knows that. The reader just follows.

Docent must do the same for any codebase. The hard part is not the writing. The hard part is finding the right order.

---

## The Output

The output is a single HTML page that opens in the browser. It reads like a walk-through, not a reference doc. No sidebars, no navigation trees, no API tables, no clickable doors.

The reader scrolls. The walk-through takes them from the outside of the building to the inside, from the trunk to the branches, zooming in and out as needed, until the architecture feels inevitable.

The zoom sequence:

**1. The Exterior**
What is this building. Why does it exist. What kind of building is it — described in terms the reader already knows, not technical labels.

**2. What's Visible from Outside**
The surfaces someone can see before entering. What you'd do with this thing, what it accepts, what it gives back. Described in terms of what a person would see and do.

**3. The Trunk**
The central concept — the one thing that everything else in the codebase exists to support. Explained in plain language so the reader holds it before anything else is introduced.

**4. The Branches**
The parts that connect to the trunk, introduced one at a time, in the order that makes each one feel inevitable. Each branch arrives as the answer to a question the previous section raised. The walk-through zooms in and out as needed — sometimes going deeper into a branch, sometimes pulling back to show how two branches connect.

The reader should finish and feel like the architecture is obvious — "of course it works that way" — because each piece was the inevitable solution to a problem they already understood.

---

## The Term Rule

The reader does not know what a CLI, an API, a library, a framework, a module, a function, a server, or a test suite is. Every technical concept must be described in plain language before it is named.

The NLP doc does this with "vector": it doesn't say "a vector is like a list." It says "we assign it to a list of numbers, called a vector" and immediately shows why that matters. The term arrives after the reader already understands the concept.

Docent must do the same for every piece of technical vocabulary. "A window on your computer you type commands into" comes before "command-line tool." "A collection of pieces of code other people use to build new code on top of" comes before "library."

The description is the definition. The term is just a shorter name for something the reader already holds.

---

## The Generation Task

The system reads a repo and produces the walk-through in two steps.

### Step 1: The Skeleton (trunk-finder)

One call. Global view. Reads the entire packed codebase and produces a structural map:

- **The trunk**: The single most foundational concept in the codebase — the one thing everything else hangs off of. Not a file name. A concept, described in plain language.
- **The branches**: The 2-4 major parts that connect to the trunk, ordered by dependency — which branches require understanding other branches first.
- **For each branch**: A one-line description of what problem it solves and why it exists.

The skeleton is docent's point of view. It's the guide's opinion about the shape of the building and the order the wings make sense in. It does not contain prose — it's a structural plan that the section writer will follow.

The skeleton does not need to be exhaustive. It covers the trunk and the first level of branches. Deeper structure is discovered during writing.

### Step 2: The Walk-Through (recursive section writer)

Multiple calls. Local view. Given the skeleton and everything written so far, writes the next section of the walk-through and decides what comes after.

Each call produces:
- **A section**: A chunk of the walk-through (a few paragraphs). Plain language. Follows the term rule. Builds on what the reader already knows.
- **A next-step decision**: Go deeper into the current branch, move to the next branch on the skeleton, or stop.

The next-step decision is the recursive part. After writing a section about the trunk, the writer might decide the reader needs to go one level deeper before moving to the first branch. Or it might decide the reader is ready. This judgment can only be made after the writing — the act of explaining something reveals what the reader needs next.

The recursion carries a goal: **builder-readiness**. At each step, pick the next section that most increases the reader's ability to contribute to the project. Not just understand — contribute.

The recursion terminates when the major branches have been covered to the depth needed for a developer to start working.

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
2. ~~Build the interactive space generation (v1 inference): Space/Door model with reader-chosen navigation.~~ Done, being replaced.
3. Build the skeleton-finder: given the reader output, find the trunk and ordered branches.
4. Build the section writer: given the skeleton + prior sections, write the next section and decide what comes next.
5. Build the walk-through generator: wire skeleton-finder and section writer into a loop that produces the full walk-through.
6. Update the server: serve the complete walk-through as a single page (replace the door-clicking API).
7. Update the frontend: render the linear walk-through (replace door-clicking UI).
8. Wire everything together as the `docent` command.
9. Test on real repos of increasing complexity. Evaluate whether the output passes the writing standard and the "of course" test.

---

## Files

```
docent/
  resources/
    Natural-Language-Processing.pdf   # Reference for output quality
    AVOID.md                          # Writing anti-patterns to avoid
  src/
    backend/
      reader.ts                       # Public API: readRepo(dir) -> ReadResult
      reader/
        types.ts                      # ReaderResult, ManifestFile interfaces
        context.ts                    # README finder, file tree builder
        manifests.ts                  # Manifest detection + project name extraction
        pack.ts                       # Repomix integration for packing source
      space.ts                        # (v1, being replaced) Space/Door generation
      skeleton.ts                     # (next) Skeleton-finder: trunk + ordered branches
      section.ts                      # (next) Section writer: recursive walk-through generation
      client.ts                       # Anthropic API client wrapper (callClaude)
      server.ts                       # HTTP server (will be updated for linear walk-through)
    frontend/
      index.html                      # Page shell — loads style.css and app.js
      style.css                       # All styling
      app.js                          # Client-side rendering (will be updated for linear walk-through)
    cli.ts                            # (not built yet) Entry point: `docent`
  test/
    reader/                           # Unit tests for reader module
    inference/                        # Unit tests for space/prompt module (will be updated)
    writer/                           # Tests for frontend static files
    fixtures/                         # Minimal fake repos for testing
    manual-check.ts                   # Run reader on any repo with progress logs
    manual-writer.ts                  # Run reader + server on any repo (calls API)
  CLAUDE.md                           # This file
```

---

## Current Status

### Done
- **Reader module** (`src/backend/reader.ts`): Takes any directory, returns manifests, README, file tree, and Repomix-packed source. Language-agnostic. Filters binary files from tree. 23 tests.
- **v1 Space generation** (`src/backend/space.ts`): Interactive Space/Door model. Works but is being replaced by the skeleton + section writer approach.
- **v1 Backend server** (`src/backend/server.ts`): HTTP server with door-clicking API. Will be updated.
- **v1 Frontend** (`src/frontend/`): Door-clicking UI. Will be updated.

### Next
- **Skeleton-finder** (`src/backend/skeleton.ts`): Read the whole codebase, find the trunk and ordered branches.
- **Section writer** (`src/backend/section.ts`): Given skeleton + prior sections, write the next chunk and decide what comes next.

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
