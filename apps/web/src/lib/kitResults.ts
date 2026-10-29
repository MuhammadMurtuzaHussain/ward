// The school kit's results: the teacher types in totals counted from the paper surveys, and Ward
// shows the change from before to after. Only totals are kept (never a child's sheet), on this
// device, under the teacher's own key rather than a child's profile.

const KEY = "ward.kit.v1";

/** Totals for one round of sheets. Each array holds counts per answer option, in sheet order. */
export interface Tally {
  sheets: number;
  /** Part A: yes, no, not sure, for each question. */
  a: number[][];
  /** Told an adult: yes, no, nothing happened. */
  tell: number[];
  /** Part B: no way, not really, mostly, definitely, for each statement. */
  b: number[][];
  /** After only: used Ward yes, no; and the parts ticked. */
  used: number[];
  parts: number[];
}

export interface KitClass {
  id: string;
  name: string;
  /** Lesson ids taught in class mode. */
  taught: string[];
  before: Tally;
  after: Tally;
}

export const emptyTally = (): Tally => ({
  sheets: 0,
  a: [0, 1, 2].map(() => [0, 0, 0]),
  tell: [0, 0, 0],
  b: [0, 1, 2, 3, 4, 5].map(() => [0, 0, 0, 0]),
  used: [0, 0],
  parts: [0, 0, 0, 0, 0],
});

export function loadClasses(): KitClass[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as KitClass[]) : [];
  } catch {
    return [];
  }
}

export function saveClasses(cs: KitClass[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cs));
  } catch {
    // Storage full or private mode: the numbers stay on screen for this visit.
  }
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);
const sum = (xs: number[]) => xs.reduce((n, x) => n + (Number.isFinite(x) ? x : 0), 0);

export type Measure = "a" | "tell" | "b" | "used";
export interface Row {
  id: string;
  measure: Measure;
  /** Index into the survey's questions for this measure. */
  index: number;
  before: number | null;
  after: number | null;
  /** For part A, fewer is better. */
  lowerIsBetter: boolean;
}

/** One row per question: the share giving the answer that matters, before and after. */
export function score(c: Pick<KitClass, "before" | "after">): Row[] {
  const rows: Row[] = [];
  const both = (f: (t: Tally) => number | null) => [f(c.before), f(c.after)] as const;
  c.before.a.forEach((_, i) => {
    const [before, after] = both((t) => pct(t.a[i]![0]!, sum(t.a[i]!)));
    rows.push({ id: `a${i + 1}`, measure: "a", index: i, before, after, lowerIsBetter: true });
  });
  {
    // Of the children something happened to (yes or no), how many told an adult.
    const [before, after] = both((t) => pct(t.tell[0]!, t.tell[0]! + t.tell[1]!));
    rows.push({ id: "tell", measure: "tell", index: 0, before, after, lowerIsBetter: false });
  }
  c.before.b.forEach((_, i) => {
    const [before, after] = both((t) => pct(t.b[i]![2]! + t.b[i]![3]!, sum(t.b[i]!)));
    rows.push({ id: `b${i + 1}`, measure: "b", index: i, before, after, lowerIsBetter: false });
  });
  rows.push({ id: "used", measure: "used", index: 0, before: null, after: pct(c.after.used[0]!, sum(c.after.used)), lowerIsBetter: false });
  return rows;
}

/** Below this many sheets in a round, results swing a lot and could identify children. */
export const SMALL = 10;

/** Totals as CSV for sharing: class, round, question, option index, count. No child's answers. */
export function totalsCsv(cs: KitClass[]) {
  const out = [["class", "round", "sheets", "question", "option", "count"].join(",")];
  const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  for (const c of cs)
    for (const round of ["before", "after"] as const) {
      const t = c[round];
      const put = (id: string, counts: number[]) => counts.forEach((n, o) => out.push([q(c.name), round, t.sheets, id, o, n || 0].join(",")));
      t.a.forEach((x, i) => put(`a${i + 1}`, x));
      put("tell", t.tell);
      t.b.forEach((x, i) => put(`b${i + 1}`, x));
      if (round === "after") {
        put("used", t.used);
        put("parts", t.parts);
      }
    }
  return out.join("\n") + "\n";
}
