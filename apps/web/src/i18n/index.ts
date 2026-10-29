import { en, type Dict } from "./en.ts";
import { ur } from "./ur.ts";
import { getState, useStore, type Lang } from "../lib/store.ts";

export const DICTS: Record<Lang, Dict> = { en, ur };
export type { Dict };

/** The active language's words, re-rendering when the child switches language. */
export function useT(): Dict {
  return DICTS[useStore((s) => s.profile.lang)] ?? en;
}

/** For code outside React (drafts, reports). */
export function t(): Dict {
  return DICTS[getState().profile.lang] ?? en;
}

/** Numbers and dates in the child's language. */
export const locale = () => (getState().profile.lang === "ur" ? "ur-PK" : undefined);
