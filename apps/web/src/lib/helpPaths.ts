// Which paths to help a result shows. One pure function, so the rules can be tested: help is only
// ever added, never taken away. A danger Ward is sure of gets HelpNow at the top; a dangerous-
// sounding message it isn't sure about gets the same help, labelled as unconfirmed; and every
// calm or "keep an eye" result keeps a quiet "It still feels wrong" door to the Coach, because
// Ward misses things. When the child's own words sound like they want to die or to hurt
// themselves, care and the helplines come first, and "Was I mean?" is never asked. Someone telling
// what was done to them and asking for help is named as someone who may need support.

import type { Analysis, Finding, Level } from "@ward/engine";
import { raisesHelp, type Correction } from "./corrections.ts";
import type { AgeBand } from "./store.ts";

type FindingLike = Pick<Finding, "severity" | "categories" | "unsure" | "support" | "distress"> & { message: Pick<Finding["message"], "sender"> };
export type AnalysisLike = Pick<Analysis, "level" | "selfDistress" | "support"> & { findings: FindingLike[]; patterns: Pick<Analysis["patterns"][number], "kind">[] };

/**
 * "hold": the deeper read is still running, so a calm or watch verdict isn't final yet.
 * "care": the child's own words sound like they want to die or to hurt themselves.
 */
export type Verdict = Level | "unsure" | "hold" | "care";

export interface HelpPlan {
  verdict: Verdict;
  /** HelpNow at the top of the result. */
  helpNow: boolean;
  /** ...for a danger only the small model saw: say it's unconfirmed, never hide it. */
  unconfirmed: boolean;
  /** Take It Down in that HelpNow. */
  images: boolean;
  /** "What do I do?" (the Coach) as the main button. */
  coach: boolean;
  /** "Practise spotting it": only once Ward has finished and found nothing. */
  practise: boolean;
  /** The safety plan, for 14 to 17 checking their own chat. */
  plan: boolean;
  /** The quiet "It still feels wrong" door to the Coach, with help first. */
  stillWrong: boolean;
  /** Care for the child's own distress, above HelpNow. */
  care: boolean;
  /** "Was I mean?", for the child's own harsh messages. Never asked of a child in distress. */
  mean: boolean;
  /** "Someone may need support": others telling what was done to them and asking for help. */
  support: boolean;
}

const fromOthers = (f: FindingLike, self: string | null) => f.message.sender !== self;
const isImages = (cats: readonly string[]) => cats.includes("sexual") || cats.includes("exposure");

/** A dangerous-sounding message from someone else that only the small model flagged. */
export function unsureDanger(a: AnalysisLike, self: string | null): boolean {
  return !a.patterns.some((p) => p.kind === "danger") && a.findings.some((f) => f.unsure && f.severity >= 3 && fromOthers(f, self));
}

/** The child's own words sound like they want to die or to hurt themselves. */
export function selfCare(a: AnalysisLike, self: string | null): boolean {
  return self !== null && (a.selfDistress?.length ?? 0) > 0;
}

export function helpPlan(a: AnalysisLike, opts: { self: string | null; age: AgeBand; refining: boolean; corrections?: Correction[] }): HelpPlan {
  const danger = a.level === "urgent" || a.patterns.some((p) => p.kind === "danger");
  const unsure = unsureDanger(a, opts.self);
  const care = selfCare(a, opts.self);
  const mild = a.level === "calm" || a.level === "watch";
  // Bullying and urgent can show straight away; a calm or watch verdict waits for the deeper read.
  // The child's own distress comes before both: never "this looks okay" over it.
  const verdict: Verdict = mild && care ? "care" : mild && unsure ? "unsure" : mild && opts.refining ? "hold" : a.level;
  const confirmedImages = a.findings.some((f) => f.severity >= 3 && !f.unsure && isImages(f.categories));
  // Ward Lite's flags carry no categories, so an unconfirmed danger could be about images.
  // Someone asking for help who also sounds like they want to die: the helplines, for the child to share.
  const supportCrisis = a.findings.some((f) => f.support && f.distress && fromOthers(f, opts.self));
  const helpNow = danger || unsure || care || supportCrisis;
  const correctedImages = (opts.corrections ?? []).some((c) => c.kind === "kind" && isImages([c.category ?? ""]));
  return {
    verdict,
    helpNow,
    unconfirmed: unsure && !danger,
    images: helpNow && (confirmedImages || unsure || correctedImages),
    coach: a.level !== "calm" || unsure,
    practise: a.level === "calm" && !unsure && !care && !opts.refining,
    plan: helpNow && opts.age === "14" && opts.self !== null,
    stillWrong: mild,
    care,
    // The child's own messages that could land hard: often anger after being hurt.
    // Not when quoting abuse to ask for help: the words are the bully's.
    mean: !care && opts.self !== null && a.findings.some((f) => f.severity >= 2 && !f.support && f.message.sender === opts.self),
    support: (a.support?.length ?? 0) > 0,
  };
}

/** The help under one corrected message, when nothing at the top of the screen already shows it. */
export function correctionHelp(c: Correction | undefined, gated: boolean): { help: boolean; images: boolean } {
  const help = !!c && (raisesHelp(c) || gated);
  return { help, images: help && c!.kind === "kind" && isImages([c!.category ?? ""]) };
}

/**
 * The level a check is remembered by (Home's recent checks, the vault list). A check with an
 * unconfirmed dangerous message, or with the child's own distress, is never remembered as "Looks
 * okay": it becomes "Keep an eye", the mildest level that isn't calm, and nothing more is claimed.
 */
export function historyLevel(a: AnalysisLike, self: string | null): Level {
  return a.level === "calm" && (unsureDanger(a, self) || selfCare(a, self)) ? "watch" : a.level;
}
