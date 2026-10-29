// Slang packs: plain JSON lists a teacher or a youth group can edit, one per language.
// They are the layer that works with no model at all, on the cheapest phone, instantly.

import en from "../packs/en.json" with { type: "json" };
import urLatn from "../packs/ur-Latn.json" with { type: "json" };
import hiLatn from "../packs/hi-Latn.json" with { type: "json" };
import bn from "../packs/bn.json" with { type: "json" };
import { normalize, skeleton, words } from "./normalize.ts";
import type { Category, PackHit, Severity } from "./types.ts";

export interface PackEntry {
  /** The word or phrase, written the most common way. */
  t: string;
  c: Category;
  s: Severity;
  /** English meaning. */
  g: string;
}

export interface Pack {
  lang: string;
  name: string;
  about?: string;
  entries: PackEntry[];
}

export const STARTER_PACKS: Pack[] = [en, urLatn, hiLatn, bn] as Pack[];

interface Compiled {
  entry: PackEntry;
  lang: string;
  tokens: string[];
}

const LATIN = /^[a-z']+$/;

/** "kutta" -> "kutt": so "kutte", "kutti", "kuttay" all match. */
function stem(w: string): string {
  return w.replace(/[aeiouy]+$/, "");
}

function tokenMatches(text: string, term: string, exact: boolean): boolean {
  if (text === term) return true;
  if (exact || !LATIN.test(term) || term.length < 4) return false;
  // Inflections add letters ("kutta" -> "kuttay") more than they drop them, so a shorter word may
  // be at most one letter short: "chuti" (a holiday) must not match "chutiya".
  // Only gender and plural endings (a, e, i, ay) inflect; "gandu" and "gande" (dirty) differ by meaning.
  const d = text.length - term.length;
  if (/[aeiy]$/.test(term) && /[aeiy]$/.test(text) && d >= -1 && d <= 2 && stem(text).length >= 3 && stem(text) === stem(term)) return true;
  if (term.length >= 6 && text.length >= 5) {
    const sk = skeleton(term);
    return sk.length >= 4 && skeleton(text) === sk;
  }
  return false;
}

function prep(text: string): string[] {
  return words(normalize(text).replace(/['’]/g, ""));
}

export class PackMatcher {
  private compiled: Compiled[];
  readonly langs: string[];

  constructor(packs: Pack[] = STARTER_PACKS) {
    this.langs = packs.map((p) => p.lang);
    this.compiled = packs.flatMap((p) =>
      p.entries.map((entry) => ({ entry, lang: p.lang, tokens: prep(entry.t) })).filter((c) => c.tokens.length > 0),
    );
  }

  match(text: string): PackHit[] {
    const toks = prep(text);
    const hits: PackHit[] = [];
    const seen = new Set<string>();
    // Fuzzy matches may only claim words no exact match took ("kutte" is kutta, not also kutti).
    const fuzzyClaimed = new Set<number>();
    for (const exact of [true, false]) {
      for (const { entry, lang, tokens } of this.compiled) {
        if (seen.has(entry.t)) continue;
        for (let i = 0; i + tokens.length <= toks.length; i++) {
          if (!exact && tokens.some((_, j) => fuzzyClaimed.has(i + j))) continue;
          if (tokens.every((t, j) => tokenMatches(toks[i + j]!, t, exact))) {
            hits.push({ term: entry.t, lang, category: entry.c, severity: entry.s, gloss: entry.g });
            seen.add(entry.t);
            if (!exact) tokens.forEach((_, j) => fuzzyClaimed.add(i + j));
            break;
          }
        }
      }
    }
    // A longer phrase that matched swallows the shorter ones inside it ("fat pig" over "pig").
    return hits.filter((h) => !hits.some((o) => o !== h && o.term.length > h.term.length && o.term.includes(h.term)));
  }
}
