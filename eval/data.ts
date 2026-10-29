// Downloads and caches the public eval sets from the Hugging Face datasets server, then draws a
// fixed, balanced sample from each so every run scores the same messages.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

export interface Item {
  text: string;
  /** true = abusive / bullying, per the dataset's own labels. */
  bad: boolean;
  set: string;
}

const DIR = new URL("./data/", import.meta.url);

async function rows(dataset: string, config: string, split: string): Promise<Record<string, unknown>[]> {
  const file = new URL(`${dataset.replace("/", "__")}__${config}__${split}.json`, DIR);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  mkdirSync(DIR, { recursive: true });
  const out: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 100) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=${config}&split=${split}&offset=${offset}&length=100`;
    let j: { rows?: { row: Record<string, unknown> }[]; num_rows_total?: number } = {};
    for (let attempt = 0; attempt < 4; attempt++) {
      const r = await fetch(url);
      if (r.ok) {
        j = await r.json();
        break;
      }
      await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
    }
    out.push(...(j.rows ?? []).map((r) => r.row));
    if (!j.rows?.length || out.length >= (j.num_rows_total ?? 0)) break;
  }
  writeFileSync(file, JSON.stringify(out));
  return out;
}

/** Deterministic shuffle (mulberry32) so the sample never changes between runs. */
function shuffle<T>(xs: T[], seed = 26): T[] {
  let a = seed;
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function balanced(items: Item[], n: number): Item[] {
  const s = shuffle(items.filter((i) => i.text.trim().length > 3));
  return shuffle([...s.filter((i) => i.bad).slice(0, n / 2), ...s.filter((i) => !i.bad).slice(0, n / 2)]);
}

export async function loadSets(n: number): Promise<Record<string, Item[]>> {
  const ru = await rows("community-datasets/roman_urdu_hate_speech", "Coarse_Grained", "validation");
  const bn = await rows("yamin401533/bangla-cyberbullying-blindspot", "default", "test");
  const en = await rows("surrey-nlp/Cyberbullying-Detection-CB1", "default", "test");
  return {
    "Roman Urdu": balanced(
      ru.filter((r) => r.label != null).map((r) => ({ text: String(r.tweet), bad: r.label === 0, set: "Roman Urdu" })),
      n,
    ),
    Bangla: balanced(
      bn
        // Political and geopolitical rants aren't aimed at a child; keep abuse aimed at a person.
        .filter((r) => ["Non-abusive", "Personal", "Gender abusive"].includes(String(r.label)))
        .map((r) => ({ text: String(r.text), bad: r.label !== "Non-abusive", set: "Bangla" })),
      n,
    ),
    English: balanced(
      en
        // The "age/religion/ethnicity" classes are mostly tweets about bullying, not aimed at a person;
        // keep the targeted classes so the set asks the same question Ward does.
        .filter((r) => ["not_cyberbullying", "gender", "other_cyberbullying"].includes(String(r.cyberbullying_type)))
        .map((r) => ({ text: String(r.tweet_text), bad: r.cyberbullying_type !== "not_cyberbullying", set: "English" })),
      n,
    ),
  };
}
