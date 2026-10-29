// Candidate Roman Urdu slang-pack words, mined from the dataset's TRAIN split (the scorecard uses
// the validation split, so nothing leaks). Prints words much more common in abusive tweets than
// normal ones; a person then reads the list and keeps only real insults and threats.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { normalize, words } from "../packages/engine/src/index.ts";

const file = new URL("./data/ru-train.json", import.meta.url);
if (!existsSync(file)) {
  mkdirSync(new URL("./data/", import.meta.url), { recursive: true });
  const out: unknown[] = [];
  for (let offset = 0; offset < 7300; offset += 100) {
    const r = await fetch(`https://datasets-server.huggingface.co/rows?dataset=community-datasets/roman_urdu_hate_speech&config=Coarse_Grained&split=train&offset=${offset}&length=100`);
    const j = (await r.json()) as { rows?: { row: unknown }[] };
    if (!j.rows?.length) break;
    out.push(...j.rows.map((x) => x.row));
  }
  writeFileSync(file, JSON.stringify(out));
}
const rows = JSON.parse(readFileSync(file, "utf8")) as { tweet: string; label: number }[];
const bad = new Map<string, number>(), ok = new Map<string, number>();
let nb = 0, no = 0;
for (const r of rows) {
  const ws = new Set(words(normalize(r.tweet)).filter((w) => w.length >= 3));
  const m = r.label === 0 ? bad : ok;
  r.label === 0 ? nb++ : no++;
  for (const w of ws) m.set(w, (m.get(w) ?? 0) + 1);
}
const scored = [...bad.entries()]
  .filter(([, c]) => c >= 6)
  .map(([w, c]) => ({ w, c, o: ok.get(w) ?? 0, lo: Math.log(((c + 1) / nb) / (((ok.get(w) ?? 0) + 1) / no)) }))
  .filter((x) => x.lo > 1.6)
  .sort((a, b) => b.lo - a.lo);
console.log(rows.length, "train rows", nb, "abusive");
console.log(scored.slice(0, 120).map((x) => `${x.w}(${x.c}/${x.o})`).join(" "));
