/** The primary entry point of the project */
export interface FrontDoor {
  /** File path relative to repo root */
  file: string;
  /** The command to run, if applicable (e.g., "npx docent", "cargo run") */
  command?: string;
  /** What happens when the entry point is invoked */
  description: string;
}

/** Structured answers to the four inference questions */
export interface InferenceResult {
  /** One sentence: what the project does, in plain English */
  whatItDoes: string;
  /** Who uses it and what moment triggers them to reach for it */
  whoAndWhen: string;
  /** The primary entry point */
  frontDoor: FrontDoor;
  /** A 2-4 sentence scene that puts the reader inside the problem */
  scenario: string;
}
