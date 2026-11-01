// Reads Ward's eval history from Tiger Data and writes eval/history/README.md: each benchmark's
// latest score next to the run before it, any metric that got worse, and a chart over time of the
// phone tier's F1 per language (what most children run). With --check it exits 1 on a regression,
// for CI; given a commit (--check=<sha>), only on regressions that commit introduced.
//
//   pnpm history:report
//   pnpm history:report -- --check

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { connect } from "./db.ts";
import { HIGHER_IS_BETTER } from "./flatten.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const checkArg = process.argv.find((a) => a.startsWith("--check"));
const checkSha = checkArg?.split("=")[1];
/** A change smaller than this is noise on sets of 80 to 300 items. */
const TOLERANCE = 0.03;

const sql = connect();

// The last two runs of each series. Runs of one suite in one commit share a time, so ranking by time works.
const pairs = await sql<{ suite: string; system: string; lang: string; metric: string; latest: number; previous: number | null; at: Date; commit: string }[]>`
  WITH ranked AS (
    SELECT *, row_number() OVER (PARTITION BY suite, system, lang, metric ORDER BY time DESC) AS n
    FROM eval_metrics
  )
  SELECT a.suite, a.system, a.lang, a.metric, a.value AS latest, b.value AS previous, a.time AS at, a.commit
  FROM ranked a LEFT JOIN ranked b
    ON b.n = 2 AND (a.suite, a.system, a.lang, a.metric) = (b.suite, b.system, b.lang, b.metric)
  WHERE a.n = 1
  ORDER BY a.suite, a.system, a.lang, a.metric`;

// The phone tier's F1 per language, one point per run, so a language that slips shows on its own line.
const trend = await sql<{ day: Date; suite: string; metric: string; value: number }[]>`
  SELECT time AS day, 'f1' AS suite, lang AS metric, value
  FROM eval_metrics
  WHERE suite = 'scorecard' AND system = 'Phone: packs + Ward Lite' AND metric = 'f1'
  ORDER BY time`;
const [{ runs, rows }] = await sql<{ runs: number; rows: number }[]>`
  SELECT count(DISTINCT (commit, suite))::int AS runs, count(*)::int AS rows FROM eval_metrics`;
await sql.end();

const worse = pairs.filter((p) => {
  if (p.previous == null) return false;
  const d = p.latest - p.previous;
  return HIGHER_IS_BETTER.has(p.metric) ? d < -TOLERANCE : d > TOLERANCE;
});

const pct = (v: number) => (Math.abs(v) <= 1 && !Number.isInteger(v) ? `${(v * 100).toFixed(1)}%` : String(Math.round(v * 10) / 10));
const delta = (p: (typeof pairs)[number]) => {
  if (p.previous == null) return "new";
  const d = p.latest - p.previous;
  if (Math.abs(d) < 1e-9) return "same";
  const good = HIGHER_IS_BETTER.has(p.metric) ? d > 0 : d < 0;
  return `${good ? "better" : "worse"} ${d > 0 ? "+" : ""}${Math.abs(p.latest) <= 1 ? (d * 100).toFixed(1) + " pts" : d.toFixed(1)}`;
};

function chart() {
  const series = new Map<string, { day: Date; value: number }[]>();
  for (const t of trend) {
    const k = t.metric;
    series.set(k, [...(series.get(k) ?? []), { day: t.day, value: t.value }]);
  }
  const days = [...new Set(trend.map((t) => +t.day))].sort();
  if (days.length < 2) return "";
  const W = 640, H = 220, P = 36;
  const x = (d: Date) => P + ((days.indexOf(+d)) / (days.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - v * (H - 2 * P);
  const colors = ["#7c9cff", "#ff8a7a", "#6fd3a6", "#f5c46b"];
  const lines = [...series].map(([k, pts], i) => {
    const path = pts.map((p, j) => `${j ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
    return `<path d="${path}" fill="none" stroke="${colors[i % 4]}" stroke-width="2.5"/>` +
      `<text x="${W - P + 4}" y="${y(pts.at(-1)!.value) + 4}" font-size="11" fill="${colors[i % 4]}">${k.replace(/_/g, " ")}</text>`;
  });
  const grid = [0, 0.25, 0.5, 0.75, 1].map((v) =>
    `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" stroke="#8884" /><text x="4" y="${y(v) + 4}" font-size="11" fill="#888">${v * 100}%</text>`);
  const labels = days.map((d) => `<text x="${x(new Date(d))}" y="${H - 12}" font-size="11" fill="#888" text-anchor="middle">${new Date(d).toISOString().slice(5, 16).replace("T", " ")}</text>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W + 170} ${H}" font-family="system-ui,sans-serif">${grid.join("")}${labels.join("")}${lines.join("")}</svg>`;
  writeFileSync(`${here}phone-trend.svg`, svg);
  return "![The phone tier over time](phone-trend.svg)\n\n";
}

const by = (suite: string) => pairs.filter((p) => p.suite === suite && (p.lang === "all" || suite === "scorecard" || suite === "everyday"));
const table = (suite: string) => {
  const ps = by(suite);
  if (!ps.length) return "";
  return `### ${suite}\n\n| System | Language | Metric | Latest | Change | Commit |\n|---|---|---|---|---|---|\n` +
    ps.map((p) => `| ${p.system} | ${p.lang} | ${p.metric.replace(/_/g, " ")} | ${pct(p.latest)} | ${delta(p)} | \`${p.commit}\` |`).join("\n") + "\n\n";
};

const md = `# Ward's eval history

Every committed run of Ward's benchmarks, kept as a time series on [Tiger Data](https://www.tigerdata.com) (Timescale Postgres),
so a change that helps one language and hurts another shows up instead of hiding behind an average.
Only scores are stored: no test sentences, no chats. ${runs} runs, ${rows} data points.

Written by \`pnpm history:report\`; recorded by \`pnpm history:record\`, which reads each result file's git history.
"Worse" means more than ${TOLERANCE * 100} points the wrong way since the run before.

## Got worse since the last run

${worse.length ? worse.map((p) => `- **${p.suite}**, ${p.system}, ${p.lang}: ${p.metric.replace(/_/g, " ")} ${pct(p.previous!)} → ${pct(p.latest)}`).join("\n") : "Nothing."}

## The phone tier's F1 per language, run by run

${chart()}## Latest scores

${["scorecard", "redteam", "chats", "everyday", "secondlook"].map(table).join("")}`;
writeFileSync(`${here}README.md`, md);
console.log(`${pairs.length} series, ${worse.length} got worse`);
const blocking = checkSha ? worse.filter((p) => checkSha.startsWith(p.commit)) : worse;
if (checkArg && blocking.length) {
  for (const p of blocking) console.error(`worse: ${p.suite} ${p.system} ${p.lang} ${p.metric} ${pct(p.previous!)} -> ${pct(p.latest)}`);
  process.exit(1);
}
