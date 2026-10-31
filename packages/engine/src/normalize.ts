// Text as kids actually type it: "kuttaaaa", "b!tch", "l00ser", zero-width tricks, mixed scripts.
// normalize() folds those into one spelling so a slang pack entry catches all of them.

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "!": "i",
  "|": "i",
};

const ZERO_WIDTH = /[​-‍⁠﻿­]/g;

export function normalize(text: string): string {
  let s = text.normalize("NFKC").replace(ZERO_WIDTH, "").toLowerCase();
  // Latin diacritics only; Urdu, Hindi and Bangla script pass through untouched.
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC");
  // Leetspeak inside words ("l00ser", "b!tch") or starting one ("@ss"), but not after one:
  // "idiot!" is an insult with an exclamation mark, not "idioti". Standalone numbers stay.
  s = s.replace(/[013457@$!|]+(?=\p{L})/gu, (m) =>
    [...m].map((c) => LEET[c] ?? c).join(""),
  );
  // "kuttaaaaa" -> "kuttaa", "stoooopid" -> "stoopid": keeps real doubles.
  s = s.replace(/(\p{L})\1{2,}/gu, "$1$1");
  // "s.t.u.p.i.d" and "s t u p i d" -> "stupid" (single letters split by dots or spaces).
  s = s.replace(/\b(?:\p{L}[.\s*_-]){3,}\p{L}\b/gu, (m) => m.replace(/[.\s*_-]/g, ""));
  return s.replace(/\s+/g, " ").trim();
}

/** Words, keeping Urdu, Devanagari and Bangla letters and joining marks. */
export function words(normalized: string): string[] {
  return normalized.match(/[\p{L}\p{M}']+/gu) ?? [];
}

/**
 * A rough sound-skeleton for Roman Urdu and Hinglish, where one word has many spellings:
 * "bewakoof", "bewkuf", "bevakoof" all become "bvkf". Vowels go, doubled letters collapse,
 * and look-alike sounds merge. Only used for pack terms of 5+ letters, to keep false hits rare.
 */
export function skeleton(word: string): string {
  return word
    .replace(/w/g, "v")
    .replace(/ph/g, "f")
    .replace(/q/g, "k")
    .replace(/z/g, "j")
    .replace(/(?<=.)[aeiouy]/g, "")
    .replace(/h(?=$)/, "")
    .replace(/(.)\1+/g, "$1");
}
