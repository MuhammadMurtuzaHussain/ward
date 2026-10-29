// Lists every fixed line Ward reads aloud, in English and Urdu, keyed the way src/lib/speech.ts
// looks clips up. `node scripts/narrate.ts` counts the clips still missing from
// public/audio/manifest.json, `--json` lists them, and `--add <key> <file>` records one.
//
// The English clips were recorded with ElevenLabs (eleven_v4, voice "Tasha"): about twenty lines
// per take, separated by [long pause] tags, then cut at the take's longest silences with ffmpeg
// and kept only when every cut was clearly longer than any pause inside a line. Urdu has no clips
// yet, so it uses the device's own Urdu voice.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { UNITS, UNITS_UR, type Unit } from "@ward/lessons";
import { en } from "../src/i18n/en.ts";
import { ur } from "../src/i18n/ur.ts";

type Lang = "en" | "ur";
const MANIFEST = new URL("../public/audio/manifest.json", import.meta.url);

export function clipKey(lang: Lang, text: string) {
  return createHash("sha1").update(`${lang}|${text.trim()}`).digest("hex").slice(0, 16);
}

function lessonLines(units: Unit[]) {
  const out: string[] = [];
  for (const u of units)
    for (const l of u.lessons)
      for (const ex of l.exercises) {
        if (ex.kind === "truefalse") out.push(ex.statement, ex.why);
        else if (ex.kind === "choose") out.push(ex.prompt, ...ex.options.map((o) => o.why));
        else if (ex.kind === "write") out.push(ex.prompt);
        else out.push(ex.prompt, ex.why);
      }
  return out;
}

function appLines(t: typeof en) {
  // Verdicts as the child hears them about their own chat (a friend's chat uses the device voice).
  const v = Object.values(t.result.verdict).flatMap(([title, line]) => [title, line(t.result.you, t.result.your)]);
  return [
    t.onboarding.hello,
    t.onboarding.helloLine,
    t.onboarding.promiseTitle,
    ...t.onboarding.promises.flat(),
    t.coach.dontReply,
    t.coach.dontReplyLine,
    t.coach.neverPay,
    ...v,
    t.result.bullyingTeen,
  ];
}

export function lines(): { lang: Lang; text: string; key: string }[] {
  const seen = new Set<string>();
  const all = [
    ...[...appLines(en), ...lessonLines(UNITS)].map((text) => ({ lang: "en" as const, text })),
    ...[...appLines(ur), ...lessonLines(UNITS_UR)].map((text) => ({ lang: "ur" as const, text })),
  ];
  return all
    .map((l) => ({ ...l, text: l.text.trim(), key: clipKey(l.lang, l.text) }))
    .filter((l) => l.text && !seen.has(l.key) && seen.add(l.key));
}

const manifest: Record<string, string> = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};

if (process.argv[2] === "--add") {
  const [, , , key, file] = process.argv;
  manifest[key!] = file!;
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
} else {
  const missing = lines().filter((l) => !manifest[l.key]);
  const chars = (lang: Lang) => missing.filter((l) => l.lang === lang).reduce((n, l) => n + l.text.length, 0);
  if (process.argv.includes("--json")) console.log(JSON.stringify(missing));
  else console.log(`${missing.length} clips missing: en ${chars("en")} chars, ur ${chars("ur")} chars`);
}
