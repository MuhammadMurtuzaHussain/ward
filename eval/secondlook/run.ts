// Does Gemma's second look clear Ward Lite's false alarms without clearing real abuse?
// Every red-team and everyday message is read on its own, as a phone would (word lists + Ward
// Lite). Each message ONLY Ward Lite flagged then gets Gemma's second look, with no surrounding
// chat: the hardest case, since in an app there is usually context to help.
// Run: node --experimental-strip-types eval/secondlook/run.ts gemma4:e2b [gemma4:e4b ...]
// Needs Ollama with those models; writes eval/secondlook/results.json and results.md.

import { readFileSync, writeFileSync } from "node:fs";
import { analyze, GemmaSecondLook, ollamaTransport, type Chat } from "../../packages/engine/src/index.ts";
import { WardLiteJudge } from "../../apps/discord/src/lite.ts";
import { readRaw } from "../redteam/set.ts";

const models = process.argv.slice(2);
if (!models.length) throw new Error("Name at least one Ollama model, e.g. gemma4:e2b");

interface Item { set: string; lang: string; text: string; hurtful: boolean; dangerous: boolean }
const items: Item[] = [
  ...readRaw().map(({ item }) => ({ set: "red-team", lang: item.lang, text: item.text, hurtful: item.severity > 0, dangerous: item.severity >= 3 })),
  ...readFileSync(new URL("../everyday/everyday.jsonl", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as { text: string; lang: string })
    .map((e) => ({ set: "everyday", lang: e.lang, text: e.text, hurtful: false, dangerous: false })),
];

const lite = new WardLiteJudge();
const one = (text: string): Chat => ({ source: "paste", messages: [{ id: 0, at: null, sender: "Sam", text, media: false }], events: [], participants: ["Sam"] });

// Which messages only Ward Lite flagged (no word-list hit).
const flagged: Item[] = [];
for (const it of items) {
  const a = await analyze(one(it.text), { self: null, judges: [lite], requireContext: false });
  const f = a.findings[0]!;
  if (f.severity > 0 && f.hits.length === 0) flagged.push(it);
}
console.log(`${items.length} messages; Ward Lite alone flagged ${flagged.length}`);

const results: Record<string, { cleared: Item[]; kept: Item[]; noAnswer: Item[]; seconds: number }> = {};
for (const model of models) {
  const look = new GemmaSecondLook(ollamaTransport(model), model, true);
  const r = { cleared: [] as Item[], kept: [] as Item[], noAnswer: [] as Item[], seconds: 0 };
  const t0 = Date.now();
  for (const it of flagged) {
    const v = (await look.review(one(it.text), [0], null)).get(0);
    (v === undefined ? r.noAnswer : v.hostile ? r.kept : r.cleared).push(it);
  }
  r.seconds = (Date.now() - t0) / 1000;
  results[model] = r;
  console.log(`${model}: cleared ${r.cleared.length}, kept ${r.kept.length}, no answer ${r.noAnswer.length}, ${r.seconds.toFixed(0)} s`);
}

const count = (xs: Item[], p: (i: Item) => boolean) => xs.filter(p).length;
const harmless = (i: Item) => !i.hurtful;
const rows = models.map((m) => {
  const r = results[m]!;
  return `| ${m} | ${count(r.cleared, harmless)} of ${count(flagged, harmless)} | ${count(r.cleared, (i) => i.hurtful)} of ${count(flagged, (i) => i.hurtful)} | ${count(r.cleared, (i) => i.dangerous)} of ${count(flagged, (i) => i.dangerous)} | ${(r.seconds / Math.max(1, flagged.length)).toFixed(1)} s |`;
});
const md = `# Gemma's second look

Every red-team (${items.filter((i) => i.set === "red-team").length}) and everyday (${items.filter((i) => i.set === "everyday").length}) message, read alone as a phone would. Ward Lite alone flagged ${flagged.length}; each got Gemma's second look **with no surrounding chat** (in the app there's usually context, which should help).

| Model | False alarms cleared (good) | Hurtful messages cleared (bad) | Dangerous messages cleared (worst) | Per message |
| --- | --- | --- | --- | --- |
${rows.join("\n")}

${models
  .map((m) => {
    const bad = results[m]!.cleared.filter((i) => i.hurtful);
    return `**${m}, hurtful messages it cleared:**\n\n${bad.length ? bad.map((i) => `- (${i.lang}${i.dangerous ? ", dangerous" : ""}) ${i.text}`).join("\n") : "- none"}`;
  })
  .join("\n\n")}

**What Ward does with this.** A model gets to clear Ward Lite's flags only if it clears most false alarms and almost no real abuse, and no dangerous message. Gemma 4 E4B does (computers, and the Discord bot when its host runs it). Gemma 4 E2B (phones) cleared real abuse, including a dangerous message, so on phones its "hostile" backs a flag up and its "not hostile" is ignored; the context rules decide instead. The list of models allowed to clear is \`CAN_CLEAR\` in packages/engine/src/ollama.ts.

Rerun: \`node --experimental-strip-types eval/secondlook/run.ts gemma4:e2b gemma4:e4b\`
`;
writeFileSync(new URL("./results.md", import.meta.url), md);
writeFileSync(new URL("./results.json", import.meta.url), JSON.stringify({ flagged: flagged.length, results }, null, 2));
console.log(md);
