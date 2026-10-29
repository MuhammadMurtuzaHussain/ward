// The Resilience Path: short lessons (2 to 4 minutes) in seven units. Each lesson is a handful
// of exercises. Content is plain data so a school or youth group can translate or extend it.

export type AgeBand = "8" | "11" | "14";

export interface ChatLine {
  from: string;
  text: string;
  /** For "spot": this line is a red flag. */
  flag?: boolean;
}

export type Exercise =
  | {
      kind: "choose";
      prompt: string;
      chat?: ChatLine[];
      options: { text: string; right?: boolean; why: string }[];
    }
  | {
      kind: "spot";
      prompt: string;
      chat: ChatLine[];
      /** Shown after answering. */
      why: string;
    }
  | {
      kind: "sort";
      prompt: string;
      bins: [string, string];
      items: { text: string; bin: 0 | 1 }[];
      why: string;
    }
  | {
      kind: "truefalse";
      statement: string;
      answer: boolean;
      why: string;
    }
  | {
      kind: "write";
      prompt: string;
      chat?: ChatLine[];
      /** What a good answer does, for Gemma's feedback and for the offline fallback. */
      goal: string;
      example: string;
    };

export interface Lesson {
  id: string;
  title: string;
  /** One line on the path. */
  line: string;
  ages: AgeBand[];
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  /** What the unit teaches, in a sentence a 10-year-old understands. */
  about: string;
  icon: "eye" | "hand" | "camera" | "chat" | "users" | "lock" | "heart";
  lessons: Lesson[];
}
