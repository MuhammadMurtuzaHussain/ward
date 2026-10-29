// One lesson, full screen. Check, get Ward's reaction, continue. A wrong answer comes back at the
// end of the lesson (like Duolingo), but there are no hearts to lose: kids learning to cope with
// bullying shouldn't be punished for a wrong guess.

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle, Fire, Lightning, X, XCircle } from "@phosphor-icons/react";
import { lessonById, lessonXp, type ChatLine, type Exercise } from "@ward/lessons";
import { Ghost } from "../components/Ghost.tsx";
import { Button } from "../components/ui.tsx";
import { back, finishLesson, getState, liveStreak, useStore } from "../lib/store.ts";
import { gradeWriting } from "../lib/grade.ts";

type Answer = { right: boolean; why: string; mine?: string };

function shuffle<T>(xs: T[], seed: number) {
  const out = [...xs];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function LessonPlayer({ id }: { id: string }) {
  const found = lessonById(id);
  const p = useStore((s) => s.profile);
  const reduce = useReducedMotion();
  const [queue, setQueue] = useState<number[]>(() => found?.lesson.exercises.map((_, i) => i) ?? []);
  const [pos, setPos] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [firstTry, setFirstTry] = useState<Set<number>>(new Set());
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState<{ xp: number; streak: number } | null>(null);

  if (!found) {
    return (
      <main className="grid min-h-[100dvh] place-items-center">
        <Button onClick={() => back({ name: "path" })}>Back to your path</Button>
      </main>
    );
  }
  const { lesson, unit } = found;
  const total = lesson.exercises.length;
  const exIndex = queue[pos];
  const ex = exIndex !== undefined ? lesson.exercises[exIndex] : undefined;
  const progress = finished ? 1 : pos / Math.max(queue.length, total);

  function submit(a: Answer) {
    setAnswer(a);
    if (exIndex === undefined) return;
    if (a.right && !missed.has(exIndex)) setFirstTry((s) => new Set(s).add(exIndex));
    // A miss comes back once at the end; a second miss just moves on, with the answer explained.
    if (!a.right && !missed.has(exIndex)) {
      setMissed((s) => new Set(s).add(exIndex));
      setQueue((q) => [...q, exIndex]);
    }
  }

  function next() {
    setAnswer(null);
    if (pos + 1 >= queue.length) {
      const xp = lessonXp(firstTry.size);
      finishLesson(lesson.id, xp);
      setFinished({ xp, streak: liveStreak(getState().profile) });
      return;
    }
    setPos(pos + 1);
  }

  if (finished)
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <Ghost mood="cheer" size={150} />
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">Lesson done</h1>
        <p className="mt-2 text-lg text-dim">{lesson.title}</p>
        <div className="mt-8 grid w-full grid-cols-2 gap-3">
          <div className="rounded-card border border-line bg-surface p-4">
            <Lightning size={24} weight="fill" className="mx-auto text-glow" />
            <p className="mt-1 font-display text-3xl font-bold">+{finished.xp}</p>
            <p className="text-sm text-dim">XP</p>
          </div>
          <div className="rounded-card border border-line bg-surface p-4">
            <Fire size={24} weight="fill" className="mx-auto text-glow" />
            <p className="mt-1 font-display text-3xl font-bold">{finished.streak}</p>
            <p className="text-sm text-dim">day streak</p>
          </div>
        </div>
        <Button className="mt-10 w-full" onClick={() => back({ name: "path" })}>
          Continue
        </Button>
      </main>
    );

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-4 pt-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button onClick={() => back({ name: "path" })} className="grid size-11 place-items-center rounded-full text-dim hover:bg-raised" aria-label="Leave lesson">
          <X size={24} weight="bold" />
        </button>
        <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-glow" animate={{ width: `${Math.max(4, progress * 100)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <span className="text-sm font-bold text-dim">{unit.title}</span>
      </div>

      <div className="flex-1 pb-48 pt-8">
        <AnimatePresence mode="wait">
          {ex && (
            <motion.div key={`${pos}-${exIndex}`} initial={reduce ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <ExerciseView ex={ex} seed={exIndex! + pos} locked={!!answer} onAnswer={submit} age={p.age} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {answer && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] ${answer.right ? "border-safe/30 bg-[color-mix(in_srgb,var(--surface),var(--safe)_14%)]" : "border-glow/30 bg-[color-mix(in_srgb,var(--surface),var(--glow)_12%)]"}`}
          >
            <div className="mx-auto flex max-w-2xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
              <Ghost mood={answer.right ? "cheer" : "think"} size={64} className="hidden shrink-0 sm:inline-grid" />
              <div className="flex-1">
                <p className={`flex items-center gap-2 font-display text-xl font-bold ${answer.right ? "text-safe" : "text-glow"}`}>
                  {answer.right ? <CheckCircle size={24} weight="fill" /> : <XCircle size={24} weight="fill" />}
                  {answer.right ? ["Nice one", "Exactly", "You've got it"][pos % 3] : "Not quite"}
                </p>
                <p className="mt-1 leading-relaxed">{answer.why}</p>
              </div>
              <Button autoFocus onClick={next} className="sm:min-w-36">
                Continue
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ChatView({ chat, onPick, picked, reveal }: { chat: ChatLine[]; onPick?: (i: number) => void; picked?: number | null; reveal?: boolean }) {
  return (
    <ol className="grid gap-2 rounded-card border border-line bg-surface p-4">
      {chat.map((l, i) => {
        const isPick = picked === i;
        const ring = reveal && l.flag ? "ring-2 ring-safe" : isPick ? "ring-2 ring-glow" : "";
        return (
          <li key={i}>
            <button
              disabled={!onPick}
              onClick={() => onPick?.(i)}
              className={`w-full rounded-[calc(var(--r-card)-8px)] bg-raised px-4 py-2.5 text-left transition-transform enabled:active:scale-[0.99] ${ring}`}
            >
              <span className="block text-xs font-bold text-dim">{l.from}</span>
              <span>{l.text}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ExerciseView({ ex, seed, locked, onAnswer, age }: { ex: Exercise; seed: number; locked: boolean; onAnswer: (a: Answer) => void; age: string }) {
  const [pick, setPick] = useState<number | null>(null);
  const [sorted, setSorted] = useState<Record<number, 0 | 1>>({});
  const [text, setText] = useState("");
  const [grading, setGrading] = useState(false);
  const options = useMemo(() => (ex.kind === "choose" ? shuffle(ex.options.map((o, i) => ({ ...o, i })), seed + 7) : []), [ex, seed]);

  const title = "font-display text-2xl font-bold leading-snug tracking-tight sm:text-3xl";

  const checkBar = (enabled: boolean, onCheck: () => void, label = "Check") =>
    !locked && (
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <Button className="w-full" disabled={!enabled} onClick={onCheck}>
            {label}
          </Button>
        </div>
      </div>
    );

  switch (ex.kind) {
    case "truefalse":
      return (
        <>
          <p className="text-sm font-bold text-glow">True or false?</p>
          <h1 className={`${title} mt-2`}>{ex.statement}</h1>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                disabled={locked}
                onClick={() => onAnswer({ right: v === ex.answer, why: ex.why })}
                className="min-h-24 rounded-card border-2 border-line bg-surface font-display text-2xl font-bold transition-transform hover:border-glow active:scale-[0.98]"
              >
                {v ? "True" : "False"}
              </button>
            ))}
          </div>
        </>
      );

    case "choose":
      return (
        <>
          <h1 className={title}>{ex.prompt}</h1>
          {ex.chat && <div className="mt-5"><ChatView chat={ex.chat} /></div>}
          <div className="mt-6 grid gap-3">
            {options.map((o) => (
              <button
                key={o.i}
                disabled={locked}
                onClick={() => setPick(o.i)}
                className={`min-h-16 rounded-card border-2 px-5 py-4 text-left text-[1.05rem] transition-colors ${pick === o.i ? "border-glow bg-glow-soft" : "border-line bg-surface hover:border-dim/40"}`}
              >
                {o.text}
              </button>
            ))}
          </div>
          {checkBar(pick !== null, () => {
            const o = ex.options[pick!]!;
            const right = ex.options.find((x) => x.right)!;
            onAnswer({ right: !!o.right, why: o.right ? o.why : `${o.why} Best answer: "${right.text}".` });
          })}
        </>
      );

    case "spot":
      return (
        <>
          <h1 className={title}>{ex.prompt}</h1>
          <div className="mt-6">
            <ChatView chat={ex.chat} onPick={locked ? undefined : setPick} picked={pick} reveal={locked} />
          </div>
          {checkBar(pick !== null, () => onAnswer({ right: !!ex.chat[pick!]?.flag, why: ex.why }))}
        </>
      );

    case "sort": {
      const items = ex.items;
      const all = Object.keys(sorted).length === items.length;
      return (
        <>
          <h1 className={title}>{ex.prompt}</h1>
          <ul className="mt-6 grid gap-3">
            {items.map((it, i) => (
              <li key={i} className="rounded-card border border-line bg-surface p-4">
                <p className="text-[1.05rem]">{it.text}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {ex.bins.map((b, bi) => {
                    const chosen = sorted[i] === bi;
                    const wrong = locked && chosen && it.bin !== bi;
                    const correct = locked && it.bin === bi;
                    return (
                      <button
                        key={b}
                        disabled={locked}
                        onClick={() => setSorted((s) => ({ ...s, [i]: bi as 0 | 1 }))}
                        className={`min-h-11 rounded-btn px-3 text-sm font-bold transition-colors ${
                          wrong ? "bg-alarm-soft text-alarm" : correct && chosen ? "bg-[color-mix(in_srgb,var(--safe),transparent_80%)] text-safe" : chosen ? "bg-glow text-glow-ink" : correct ? "ring-2 ring-safe" : "bg-raised text-dim hover:text-ink"
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          {checkBar(all, () => {
            const wrong = items.filter((it, i) => sorted[i] !== it.bin).length;
            onAnswer({ right: wrong === 0, why: wrong ? `${wrong} in the wrong place. ${ex.why}` : ex.why });
          })}
        </>
      );
    }

    case "write":
      return (
        <>
          <h1 className={title}>{ex.prompt}</h1>
          {ex.chat && <div className="mt-5"><ChatView chat={ex.chat} /></div>}
          <label htmlFor="write" className="sr-only">
            Your answer
          </label>
          <textarea
            id="write"
            value={text}
            disabled={locked}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Write it your way"
            className="mt-6 w-full resize-y rounded-card border-2 border-line bg-surface p-4 text-[1.05rem] leading-relaxed text-ink placeholder:text-dim/70 focus:border-glow focus:outline-none"
          />
          {checkBar(text.trim().length > 8 && !grading, async () => {
            setGrading(true);
            const g = await gradeWriting(ex, text, age);
            setGrading(false);
            onAnswer({ right: true, why: g });
          }, grading ? "Ward is reading…" : "Check")}
        </>
      );
  }
}
