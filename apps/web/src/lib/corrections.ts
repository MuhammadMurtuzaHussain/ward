// "This is wrong": the child's corrections to Ward's judgements. A correction changes only what
// the child sees for that one message; the analysis, the verdict and every report stay exactly
// as the engine made them. Corrections live in the profile on this device, keyed by the message's
// fingerprint (no words, no names), and leave it only in a file the child chooses to save.
//
// The safety gate: a dangerous message (severity 3, or a threat, self-harm urging, sexual
// pressure or exposure) is never softened. The child is thanked, the help stays where it was.

import type { Category, Finding, Severity } from "@ward/engine";

export type CorrectionKind = "fine" | "worse" | "kind";

export interface Correction {
  kind: CorrectionKind;
  /** For "kind": what sort of hurtful the child says it really was. */
  category?: Category;
  at: number;
  /** What Ward said at the time, so a shared correction makes sense without the message. */
  ward: { severity: Severity; categories: Category[]; by: string };
}

export const DANGER_CATEGORIES: readonly Category[] = ["threat", "selfharm", "sexual", "exposure"];

export const isDangerous = (f: Pick<Finding, "severity" | "categories">) => f.severity >= 3 || f.categories.some((c) => DANGER_CATEGORIES.includes(c));

/** Who made the judgement: a model by name, or the word lists. */
export const judgedBy = (f: Pick<Finding, "model">) => f.model?.model ?? "word lists";

export interface CorrectedView {
  /** Show the message as okay: dimmed, with Ward's note replaced by the child's. */
  softened: boolean;
  /** The child said "not mean" about a dangerous message: thank them, keep the help, say why. */
  gated: boolean;
  /** Keep the alarm styling and Ward's own note. Always true for dangerous messages. */
  keepWarning: boolean;
}

/** How one flagged message should look once the child has corrected it. */
export function correctedView(f: Pick<Finding, "severity" | "categories">, c: Correction | undefined): CorrectedView {
  const danger = isDangerous(f);
  if (!c) return { softened: false, gated: false, keepWarning: true };
  if (c.kind === "fine") return danger ? { softened: false, gated: true, keepWarning: true } : { softened: true, gated: false, keepWarning: false };
  return { softened: false, gated: false, keepWarning: true };
}

/** Newest first, at most this many kept, so the profile stays small. */
export const MAX_CORRECTIONS = 500;

export function withCorrection(all: Record<string, Correction>, fp: string, c: Correction | null): Record<string, Correction> {
  const next = { ...all };
  if (c) next[fp] = c;
  else delete next[fp];
  const keys = Object.keys(next);
  if (keys.length <= MAX_CORRECTIONS) return next;
  const keep = keys.sort((a, b) => next[b]!.at - next[a]!.at).slice(0, MAX_CORRECTIONS);
  return Object.fromEntries(keep.map((k) => [k, next[k]!]));
}

// ---- "Help make Ward better" --------------------------------------------------------------

export const CORRECTIONS_SCHEMA = "ward.corrections/v1";

export interface SharedCorrection {
  childSaid: CorrectionKind;
  category?: Category;
  ward: { severity: Severity; categories: Category[]; by: string };
  /** Only when the child ticks "include the words". Never the sender's name or the time. */
  text?: string;
}

export interface CorrectionsFile {
  schema: typeof CORRECTIONS_SCHEMA;
  language: string;
  wordLists: string[];
  corrections: SharedCorrection[];
}

/**
 * The file a child can choose to send the project: what Ward said and what the child said,
 * nothing else. No fingerprints (a short message's fingerprint can be guessed), no names, no
 * times, no dates. The words of the message only if the child asked for them.
 */
export function correctionsFile(
  items: { correction: Correction; text: string }[],
  opts: { includeText: boolean; language: string; wordLists: string[] },
): CorrectionsFile {
  return {
    schema: CORRECTIONS_SCHEMA,
    language: opts.language,
    wordLists: opts.wordLists,
    corrections: items.map(({ correction: c, text }) => ({
      childSaid: c.kind,
      ...(c.kind === "kind" && c.category ? { category: c.category } : {}),
      ward: { severity: c.ward.severity, categories: [...c.ward.categories], by: c.ward.by },
      ...(opts.includeText ? { text } : {}),
    })),
  };
}
