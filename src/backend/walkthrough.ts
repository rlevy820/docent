import type { ReaderResult } from "./reader/types.js";
import { findSkeleton } from "./skeleton.js";
import { generateSection } from "./section.js";
import { extractFeatures } from "./features.js";
import type { Section } from "./section.js";
import type { FeatureList } from "./features.js";

// --- Types ---

export interface Walkthrough {
  /** The project name */
  name: string;
  /** One-line plain-language summary of what the project does */
  what: string;
  /** The written sections, in order — the first draft */
  sections: Section[];
  /** The extracted feature list — two intro sentences + features with detail */
  featureList: FeatureList;
}

// --- Builder ---

const MAX_SECTIONS = 20; // safety cap — prevents runaway recursion

export async function buildWalkthrough(reader: ReaderResult): Promise<Walkthrough> {
  console.error("[docent] reading codebase...");
  const skeleton = await findSkeleton(reader);
  console.error(`[docent] skeleton: ${skeleton.size} project, ${skeleton.trail.length} trail stops`);

  const sections: Section[] = [];
  let stopIndex = 0;

  while (stopIndex < skeleton.trail.length && sections.length < MAX_SECTIONS) {
    const currentStop = skeleton.trail[stopIndex];
    console.error(`[docent] writing section ${sections.length + 1} — ${currentStop.concept}`);

    const section = await generateSection(
      reader,
      skeleton,
      currentStop,
      stopIndex,
      sections,
    );

    sections.push(section);

    if (section.next.action === "stop") {
      console.error("[docent] section writer decided: stop");
      break;
    }

    if (section.next.action === "forward") {
      console.error("[docent] section writer decided: forward");
      stopIndex++;
    }

    // "deeper" — stay on the same stop, loop again with the new section appended
    if (section.next.action === "deeper") {
      console.error("[docent] section writer decided: deeper");
      // stopIndex stays the same
    }
  }

  console.error(`[docent] first draft done — ${sections.length} sections`);
  console.error("[docent] extracting features...");

  const featureList = await extractFeatures(reader, {
    name: reader.name,
    what: skeleton.what,
    sections,
    featureList: { userSentence: "", codeSentence: "", features: [] },
  });

  console.error(`[docent] done — ${featureList.features.length} features`);

  return {
    name: reader.name,
    what: skeleton.what,
    sections,
    featureList,
  };
}
