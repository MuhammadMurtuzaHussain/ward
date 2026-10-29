// The shapes everything in Ward passes around: a chat the child shared in, what each message
// was judged to be, and the patterns that only show up across many messages.

export type Category =
  | "insult" // name-calling, put-downs
  | "appearance" // body, face, skin, clothes
  | "identity" // religion, caste, ethnicity, gender, sexuality, disability
  | "exclusion" // "don't add her", "nobody wants you here"
  | "threat" // physical harm, "wait till school"
  | "selfharm" // telling someone to hurt or kill themselves
  | "sexual" // sexual comments, pressure, image requests
  | "exposure" // leaking photos, screenshots, address, phone number
  | "mockery"; // laughing at someone, humiliation

export const CATEGORIES: readonly Category[] = [
  "insult",
  "appearance",
  "identity",
  "exclusion",
  "threat",
  "selfharm",
  "sexual",
  "exposure",
  "mockery",
];

/** 0 nothing, 1 rude or unkind, 2 bullying, 3 dangerous (threats, self-harm urging, sexual, exposure). */
export type Severity = 0 | 1 | 2 | 3;

export interface Message {
  id: number;
  /** null when the source had no timestamps (pasted text). */
  at: Date | null;
  sender: string;
  text: string;
  /** "<Media omitted>", a deleted message, or a photo the source dropped. */
  media: boolean;
}

/** Group events from a WhatsApp export: joins, adds, removals, leaving. */
export interface ChatEvent {
  at: Date | null;
  kind: "joined" | "added" | "removed" | "left";
  /** Who joined, was added, was removed, or left. */
  who: string;
  /** Who did the adding or removing, when the export says. */
  by?: string;
  /** Index of the next message after this event, so events sort into the timeline. */
  before: number;
}

export interface Chat {
  source: "whatsapp" | "paste";
  messages: Message[];
  events: ChatEvent[];
  participants: string[];
}

export interface PackHit {
  term: string;
  lang: string;
  category: Category;
  severity: Severity;
  /** What it means, in English, for the explanation. */
  gloss: string;
}

/** What a model said about one message. */
export interface ModelJudgement {
  hostile: boolean;
  severity: Severity;
  categories: Category[];
  /** Who it is aimed at, if the model could tell. */
  target?: string;
  /** One short reason, for the timeline. */
  why?: string;
  /** Which model said it, for the scorecard and the "how Ward knows" panel. */
  model: string;
  /**
   * "full": the model may clear a slang-pack hit (Gemma 4 reading friendly banter).
   * "raise-only": it may only add or raise, never lower (small on-device models).
   */
  authority?: "full" | "raise-only";
}

export interface Finding {
  message: Message;
  severity: Severity;
  categories: Category[];
  hits: PackHit[];
  model?: ModelJudgement;
  /** Aimed at the child (by name, reply, or a model's call), as far as Ward can tell. */
  atSelf: boolean;
  why: string;
}

export type PatternKind =
  | "campaign" // one person, again and again, across days
  | "pileon" // many people at once
  | "ghosts" // accounts that joined and only attacked
  | "exclusion" // shutting someone out
  | "danger" // threats, self-harm urging, sexual pressure, exposure
  | "nightwatch" // attacks in the small hours
  | "escalating"; // getting worse over time

export interface Pattern {
  kind: PatternKind;
  /** Who is doing it. */
  senders: string[];
  messageIds: number[];
  /** One sentence for the child. Age-neutral; the UI adapts the tone. */
  summary: string;
  /** The same finding in neutral third person, for a helpline or school report. */
  fact: string;
  /** The facts behind the sentences, so the app can say them in the child's language. */
  data?: {
    kinds?: string[];
    lead?: string;
    count?: number;
    days?: number;
    others?: string[];
    names?: string[];
    removed?: boolean;
  };
}

export type Level = "calm" | "watch" | "bullying" | "urgent";

export interface Analysis {
  level: Level;
  self: string | null;
  findings: Finding[];
  patterns: Pattern[];
  /** Per sender: hostile messages, worst severity. Sorted worst first. */
  senders: { name: string; hostile: number; worst: Severity; total: number }[];
  /** Which layers ran, so the UI can say how sure Ward is. */
  layers: { packs: string[]; models: string[] };
}
