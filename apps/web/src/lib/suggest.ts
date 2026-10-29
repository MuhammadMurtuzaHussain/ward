// Lessons that respond: after a check, the lessons that fit what happened. Lessons the child
// has done still show (replaying is fine), just after the new ones. Nothing here nags.

import type { Analysis } from "@ward/engine";
import { lessonById, type Lang, type Lesson, type Unit } from "@ward/lessons";
import type { AgeBand } from "./store.ts";

export function suggestLessons(a: Analysis, self: string | null, age: AgeBand, lang: Lang, done: string[], max = 3) {
  const kinds = new Set(a.patterns.map((p) => p.kind));
  const images = a.findings.some((f) => f.severity >= 3 && (f.categories.includes("sexual") || f.categories.includes("exposure")));
  const want: string[] = [];
  if (!self) want.push("upstand-1");
  if (images) want.push("lock-2", "lock-1");
  if (kinds.has("exclusion")) want.push("spot-2");
  if (kinds.has("pileon")) want.push(self ? "stop-1" : "upstand-1");
  if (kinds.has("nightwatch")) want.push("bounce-2");
  if (a.level === "bullying" || a.level === "urgent" || kinds.has("campaign")) want.push("stop-1", "save-1", "say-1");
  if (a.level === "calm") want.push("spot-1");
  else want.push("bounce-1", "stop-2", "spot-1");

  const out: { unit: Unit; lesson: Lesson; done: boolean }[] = [];
  for (const id of new Set(want)) {
    const hit = lessonById(id, lang);
    if (hit && hit.lesson.ages.includes(age)) out.push({ ...hit, done: done.includes(id) });
  }
  return out.sort((x, y) => Number(x.done) - Number(y.done)).slice(0, max);
}
