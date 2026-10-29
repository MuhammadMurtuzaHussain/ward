export * from "./types.ts";
export { UNITS } from "./units.ts";
import { UNITS } from "./units.ts";
import type { AgeBand, Lesson, Unit } from "./types.ts";

/** XP for a finished lesson: 10, plus 2 per exercise right first time. */
export function lessonXp(firstTry: number) {
  return 10 + firstTry * 2;
}

export function unitsFor(age: AgeBand): Unit[] {
  return UNITS.map((u) => ({ ...u, lessons: u.lessons.filter((l) => l.ages.includes(age)) })).filter((u) => u.lessons.length);
}

export function lessonById(id: string): { unit: Unit; lesson: Lesson } | null {
  for (const unit of UNITS) {
    const lesson = unit.lessons.find((l) => l.id === id);
    if (lesson) return { unit, lesson };
  }
  return null;
}

/** The first lesson not yet done, in path order. */
export function nextLesson(age: AgeBand, done: string[]): { unit: Unit; lesson: Lesson } | null {
  for (const unit of unitsFor(age)) {
    const lesson = unit.lessons.find((l) => !done.includes(l.id));
    if (lesson) return { unit, lesson };
  }
  return null;
}
