import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import type { Analysis } from "@ward/engine";
import { UnitIcon } from "./UnitIcon.tsx";
import { go, useStore } from "../lib/store.ts";
import { suggestLessons } from "../lib/suggest.ts";
import { useT } from "../i18n/index.ts";

/** "Practise for next time": up to three lessons that fit what a check found. */
export function LessonSuggestions({ analysis, self }: { analysis: Analysis; self: string | null }) {
  const p = useStore((s) => s.profile);
  const t = useT();
  const picks = suggestLessons(analysis, self, p.age, p.lang, p.done);
  if (!picks.length) return null;
  return (
    <section aria-labelledby="practise">
      <h2 id="practise" className="font-display text-lg font-bold tracking-tight">
        {t.suggest.title}
      </h2>
      <p className="mt-1 text-sm text-dim">{t.suggest.line}</p>
      <ul className="mt-3 grid gap-2">
        {picks.map(({ unit, lesson, done }) => (
          <li key={lesson.id}>
            <button
              onClick={() => go({ name: "lesson", id: lesson.id })}
              className="group flex w-full items-center gap-4 rounded-card border border-line bg-surface px-4 py-3.5 text-start hover:border-dim/40"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-glow-soft text-glow">
                <UnitIcon icon={unit.icon} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-semibold">{lesson.title}</span>
                <span className="block truncate text-sm text-dim">{lesson.line}</span>
              </span>
              {done ? (
                <CheckCircle size={20} weight="fill" className="shrink-0 text-safe" aria-label={t.suggest.doneBefore} />
              ) : (
                <ArrowRight size={18} weight="bold" className="flip-rtl shrink-0 text-glow transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
