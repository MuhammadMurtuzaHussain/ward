// The Resilience Path: one winding trail of lessons, unit by unit, like a path through a dark
// garden with lamps along it. Done lessons are lit, the next one glows, later ones wait.

import { motion, useReducedMotion } from "motion/react";
import { BookOpenText, Check, Fire, Lightning, LockSimple, Star } from "@phosphor-icons/react";
import { storiesFor, unitsFor, type Lesson, type Story } from "@ward/lessons";
import { Ghost } from "../components/Ghost.tsx";
import { Pill, Screen } from "../components/ui.tsx";
import { UnitIcon } from "../components/UnitIcon.tsx";
import { go, liveStreak, useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

// Horizontal offsets for the snake, in rem.
const SWAY = [0, 3.2, 4.6, 3.2, 0, -3.2, -4.6, -3.2];

export function PathScreen() {
  const p = useStore((s) => s.profile);
  const t = useT();
  const units = unitsFor(p.age, p.lang);
  const flat = units.flatMap((u) => u.lessons);
  const currentId = flat.find((l) => !p.done.includes(l.id))?.id ?? null;
  const reduce = useReducedMotion();
  let index = 0;

  return (
    <Screen>
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t.path.title}</h1>
        <div className="flex gap-2">
          <Pill tone={liveStreak(p) ? "glow" : "quiet"}>
            <Fire size={16} weight="fill" /> {liveStreak(p)}
          </Pill>
          <Pill>
            <Lightning size={16} weight="fill" /> {p.xp}
          </Pill>
        </div>
      </header>
      <p className="mt-2 text-dim">
        {t.path.progress(p.done.length, flat.length)}
      </p>

      {units.map((u) => {
        const doneInUnit = u.lessons.filter((l) => p.done.includes(l.id)).length;
        return (
          <section key={u.id} className="mt-10" aria-labelledby={`unit-${u.id}`}>
            <div className="flex items-center gap-4 rounded-card bg-raised px-5 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-glow text-glow-ink">
                <UnitIcon icon={u.icon} />
              </span>
              <div className="min-w-0">
                <h2 id={`unit-${u.id}`} className="font-display text-xl font-bold tracking-tight">
                  {u.title}
                </h2>
                <p className="text-sm text-dim">{u.about}</p>
              </div>
              <span className="ms-auto shrink-0 text-sm font-bold text-dim">
                {doneInUnit}/{u.lessons.length}
              </span>
            </div>

            <ol className="relative mt-6 flex flex-col items-center gap-6">
              {u.lessons.map((l) => {
                const i = index++;
                const state = p.done.includes(l.id) ? "done" : l.id === currentId ? "current" : "locked";
                return (
                  <li key={l.id} style={{ transform: `translateX(${SWAY[i % SWAY.length]}rem)` }} className="relative">
                    <Node lesson={l} state={state} reduce={!!reduce} />
                    {state === "current" && (
                      <div className={`absolute top-1/2 -translate-y-1/2 ${SWAY[i % SWAY.length]! > 0 ? "end-full me-5" : "start-full ms-5"}`}>
                        <Ghost mood="happy" size={58} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            {storiesFor(p.age, p.lang, u.id).map((st) => (
              <StoryCard key={st.id} story={st} found={p.storyEnds.filter((k) => k.startsWith(`${st.id}:`)).length} />
            ))}
          </section>
        );
      })}

      {!currentId && (
        <div className="mt-12 flex flex-col items-center text-center">
          <Ghost mood="cheer" size={110} />
          <p className="mt-4 font-display text-2xl font-bold">{t.path.allLit}</p>
          <p className="mt-1 text-dim">{t.path.replay}</p>
        </div>
      )}
    </Screen>
  );
}

function Node({ lesson, state, reduce }: { lesson: Lesson; state: "done" | "current" | "locked"; reduce: boolean }) {
  const t = useT();
  const base = "relative grid size-[4.5rem] place-items-center rounded-full font-display transition-transform active:scale-95";
  return (
    <div className="flex flex-col items-center">
      <motion.button
        disabled={state === "locked"}
        onClick={() => go({ name: "lesson", id: lesson.id })}
        aria-label={`${lesson.title}${state === "done" ? t.path.done : state === "locked" ? t.path.locked : t.path.start}`}
        className={
          state === "done"
            ? `${base} bg-glow text-glow-ink shadow-[0_6px_0_0_color-mix(in_srgb,var(--glow),black_35%)]`
            : state === "current"
              ? `${base} bg-glow text-glow-ink shadow-[0_6px_0_0_color-mix(in_srgb,var(--glow),black_35%),0_0_40px_var(--halo)]`
              : `${base} bg-raised text-dim shadow-[0_6px_0_0_color-mix(in_srgb,var(--raised),black_30%)]`
        }
        animate={state === "current" && !reduce ? { scale: [1, 1.06, 1] } : undefined}
        transition={state === "current" ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {state === "done" ? <Check size={30} weight="bold" /> : state === "current" ? <Star size={30} weight="fill" /> : <LockSimple size={26} weight="bold" />}
      </motion.button>
      <span className={`mt-3 max-w-[11rem] text-center text-sm font-bold ${state === "locked" ? "text-dim" : ""}`}>{lesson.title}</span>
    </div>
  );
}

/** A story sits after its unit's lessons: always open, never locked, nothing to lose. */
function StoryCard({ story, found }: { story: Story; found: number }) {
  const t = useT();
  const total = Object.values(story.scenes).filter((x) => x.end).length;
  return (
    <button
      onClick={() => go({ name: "story", id: story.id })}
      className="group mt-8 flex w-full items-center gap-4 rounded-card border border-dashed border-glow/50 bg-surface px-5 py-4 text-start hover:border-glow"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-glow-soft text-glow">
        <BookOpenText size={24} weight="bold" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-wider text-glow">{t.story.label}</span>
        <span className="block font-display text-lg font-bold">{story.title}</span>
        <span className="block text-sm text-dim">{story.line}</span>
      </span>
      {found > 0 && <span className="shrink-0 text-sm font-bold text-dim">{found}/{total}</span>}
    </button>
  );
}
