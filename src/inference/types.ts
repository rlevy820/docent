/** A plain-language description paired with its technical term */
export interface TermPair {
  /** The concept described without jargon, as you'd explain it to someone who has never coded */
  plain: string;
  /** The technical term (e.g., "CLI", "module", "API") */
  term: string;
}

/** A way into the project, described by who would use it and why */
export interface Door {
  /** What the person is trying to do when they use this door (e.g., "use this tool") */
  relationship: string;
  /** File path relative to repo root */
  file: string;
  /** The command to run, if applicable */
  command?: string;
  /** What happens when you enter through this door */
  description: string;
}

/** A major part of the project, described by the problem it solves */
export interface Room {
  /** The problem this part solves, in plain language */
  problem: string;
  /** What this part does to solve it */
  description: string;
  /** File path(s) relative to repo root */
  files: string[];
}

/** A single step in the visitor's walk-through of the primary use case */
export interface WalkthroughStep {
  /** What the person does */
  action: string;
  /** What happens as a result */
  result: string;
}

/** Structured answers to the inference questions */
export interface InferenceResult {
  /** The opening scene — a specific person, moment, and frustration that the reader will recognize before any explanation begins */
  scenario: string;
  /** What is this building and why was it built? Plain English, one sentence. */
  exterior: string;
  /** What kind of building is it? Plain-language description, not a label. */
  buildingKind: string;
  /** What's visible from outside? Commands, inputs, outputs — described by what a person would see. */
  sides: string;
  /** What doors exist and who are they for? */
  doors: Door[];
  /** What happens when you walk through the visitor's door? Step-by-step primary use case. */
  visitorWalkthrough: WalkthroughStep[];
  /** The rooms — major parts, ordered so each answers a question the previous one raised. */
  rooms: Room[];
  /** Every technical concept, paired as plain description + term. */
  termPairs: TermPair[];
}
