// Turns each eval result file into flat rows (suite, system, lang, metric, value), so every run of
// every benchmark can sit in one time-series table. Only scores go in: no test text, no chats.

export type Row = { suite: string; system: string; lang: string; metric: string; value: number };

/** The result files the history follows, by path from the repo root. */
export const FILES = {
  scorecard: "eval/results/scorecard.json",
  redteam: "eval/results/redteam.json",
  chats: "eval/results/chats.json",
  everyday: "eval/everyday/results-after.json",
  secondlook: "eval/secondlook/results.json",
} as const;
export type Suite = keyof typeof FILES;

const rate = (a: number, b: number) => (b > 0 ? a / b : undefined);

function push(rows: Row[], suite: string, system: string, lang: string, m: Record<string, number | undefined>) {
  for (const [metric, value] of Object.entries(m))
    if (typeof value === "number" && Number.isFinite(value)) rows.push({ suite, system, lang, metric, value });
}

type J = any;

export function flatten(suite: Suite, d: J): Row[] {
  const rows: Row[] = [];
  if (suite === "scorecard") {
    for (const [lang, systems] of Object.entries<J>(d.results ?? {}))
      for (const [system, s] of Object.entries<J>(systems))
        push(rows, suite, system, lang, { precision: s.precision, recall: s.recall, f1: s.f1, accuracy: s.accuracy });
  } else if (suite === "redteam") {
    for (const [system, langs] of Object.entries<J>(d.byLang ?? {}))
      for (const [lang, s] of Object.entries<J>(langs))
        push(rows, suite, system, lang, {
          recall: rate(s.caught, s.hurtful),
          false_alarm_rate: rate(s.falseAlarms, s.harmless),
          danger_recall: rate(s.dangerCaught, s.dangerous),
          false_danger_rate: rate(s.falseDanger, s.harmless),
        });
  } else if (suite === "chats") {
    const one = (system: string, lang: string, s: J) =>
      push(rows, suite, system, lang, {
        exact: rate(s.exact, s.n),
        missed_urgent_rate: rate(s.missedUrgent, s.urgent),
        false_urgent_rate: rate(s.falseUrgent, s.notUrgent),
      });
    for (const [system, s] of Object.entries<J>(d.all ?? {})) one(system, "all", s);
    for (const [system, langs] of Object.entries<J>(d.byLang ?? {}))
      for (const [lang, s] of Object.entries<J>(langs)) one(system, lang, s);
  } else if (suite === "everyday") {
    for (const [lang, s] of Object.entries<J>(d.by_lang ?? {}))
      push(rows, suite, d.model ?? "ward-lite", lang, { false_alarm_rate: s.false_alarm_rate, urgent_rate: s.urgent_rate });
  } else if (suite === "secondlook") {
    for (const [system, s] of Object.entries<J>(d.results ?? {})) {
      const n = (s.cleared?.length ?? 0) + (s.kept?.length ?? 0) + (s.noAnswer?.length ?? 0);
      // Of the flags a second look saw: how many real harms it wrongly cleared, and how many false alarms it rightly cleared.
      const harmful = (x: J) => x.hurtful || x.dangerous;
      const cleared = s.cleared ?? [];
      const all = [...cleared, ...(s.kept ?? []), ...(s.noAnswer ?? [])];
      push(rows, suite, system, "all", {
        cleared_rate: rate(cleared.length, n),
        harm_cleared_rate: rate(cleared.filter(harmful).length, all.filter(harmful).length),
        false_alarms_cleared_rate: rate(cleared.filter((x: J) => !harmful(x)).length, all.filter((x: J) => !harmful(x)).length),
        dangerous_cleared: cleared.filter((x: J) => x.dangerous).length,
        seconds: s.seconds,
      });
    }
  }
  return rows;
}

/** Metrics where a higher number is better; every other metric is better lower. */
export const HIGHER_IS_BETTER = new Set(["precision", "recall", "f1", "accuracy", "danger_recall", "exact", "false_alarms_cleared_rate"]);
