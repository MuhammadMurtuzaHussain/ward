// "Was I mean?": a private self-check for a child worried they went too far. Five questions,
// then either reassurance or a way to make it right. Nothing is stored: the answers live only in
// this screen's state, and it never says "bully".

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Copy } from "@phosphor-icons/react";
import { lessonById } from "@ward/lessons";
import { Ghost } from "../components/Ghost.tsx";
import { UnitIcon } from "../components/UnitIcon.tsx";
import { BackBar, Button, Screen } from "../components/ui.tsx";
import { go, useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

type Answer = "yes" | "no" | "unsure";
// For each question, the answer that points to it having hurt.
const HURT_IF: Answer[] = ["yes", "no", "yes", "yes", "no"];

export function hurtScore(answers: Answer[]) {
  return answers.reduce((n, a, i) => n + (a === HURT_IF[i] ? 1 : a === "unsure" ? 0.5 : 0), 0);
}

export function Mean() {
  const t = useT();
  const p = useStore((s) => s.profile);
  const reduce = useReducedMotion();
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const qs = t.mean.questions;
  const step = answers?.length ?? -1;
  const finished = answers !== null && answers.length === qs.length;
  // Being asked to stop is enough on its own.
  const hurt = finished && (hurtScore(answers) >= 2 || answers[3] === "yes");
  const rtl = p.lang === "ur";

  return (
    <Screen>
      <BackBar title={t.mean.title} />
      <AnimatePresence mode="wait">
        <motion.div
          key={finished ? "end" : step}
          initial={reduce ? false : { opacity: 0, x: rtl ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: rtl ? 20 : -20 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          {answers === null && (
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Ghost mood="calm" size={96} />
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">{t.mean.title}</h1>
                <p className="mt-3 max-w-[48ch] text-lg leading-relaxed text-dim">{t.mean.intro}</p>
                <Button className="mt-6" onClick={() => setAnswers([])}>
                  {t.mean.start} <ArrowRight size={18} weight="bold" className="flip-rtl" />
                </Button>
              </div>
            </div>
          )}

          {answers !== null && !finished && (
            <div>
              <p className="text-sm font-bold text-dim">{t.mean.of(step + 1, qs.length)}</p>
              <div className="mt-2 flex gap-1.5" aria-hidden>
                {qs.map((_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-glow" : "bg-raised"}`} />
                ))}
              </div>
              <h1 className="mt-8 font-display text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{qs[step]}</h1>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["yes", t.mean.yes],
                    ["no", t.mean.no],
                    ["unsure", t.mean.notSure],
                  ] as [Answer, string][]
                ).map(([a, label]) => (
                  <button
                    key={a}
                    onClick={() => setAnswers([...answers, a])}
                    className="min-h-16 rounded-card border-2 border-line bg-surface px-5 font-display text-xl font-bold transition-colors hover:border-glow active:scale-[0.98]"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {finished && <Outcome hurt={hurt} onAgain={() => setAnswers(null)} />}
        </motion.div>
      </AnimatePresence>
    </Screen>
  );
}

function Outcome({ hurt, onAgain }: { hurt: boolean; onAgain: () => void }) {
  const t = useT();
  const p = useStore((s) => s.profile);
  const lessons = ["spot-1", "upstand-1"].map((id) => lessonById(id, p.lang)).filter((x) => x && x.lesson.ages.includes(p.age));

  return (
    <div>
      <div className="flex items-center gap-5">
        <Ghost mood={hurt ? "think" : "happy"} size={80} className="shrink-0" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{hurt ? t.mean.outcomeHurt : t.mean.outcomeOk}</h1>
          <p className="mt-2 leading-relaxed text-dim">{hurt ? t.mean.outcomeHurtLine : t.mean.outcomeOkLine}</p>
        </div>
      </div>

      {hurt && (
        <section aria-labelledby="repair" className="mt-10">
          <h2 id="repair" className="font-display text-xl font-bold tracking-tight">
            {t.mean.repairTitle}
          </h2>
          <ol className="mt-4 grid gap-6">
            {t.mean.steps.map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-4">
                <span className="grid size-10 place-items-center rounded-full bg-glow-soft font-display font-bold text-glow">{i + 1}</span>
                <div>
                  <h3 className="font-display text-lg font-bold">{title}</h3>
                  <p className="mt-1 leading-relaxed text-dim">{body}</p>
                  {i === 2 && (
                    <ul className="mt-3 grid gap-2">
                      {t.mean.sorry.map((line) => (
                        <SorryLine key={line} text={line} />
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {lessons.length > 0 && (
        <section aria-labelledby="mean-learn" className="mt-10">
          <h2 id="mean-learn" className="font-display text-lg font-bold tracking-tight">
            {t.mean.learn}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {lessons.map((x) => (
              <li key={x!.lesson.id}>
                <button
                  onClick={() => go({ name: "lesson", id: x!.lesson.id })}
                  className="flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3.5 text-start hover:border-dim/40"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-glow-soft text-glow">
                    <UnitIcon icon={x!.unit.icon} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-semibold">{x!.lesson.title}</span>
                    <span className="block truncate text-sm text-dim">{x!.lesson.line}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button tone="quiet" className="mt-10" onClick={onAgain}>
        {t.mean.again}
      </Button>
    </div>
  );
}

function SorryLine({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <li className="flex items-start gap-3 rounded-btn bg-raised px-4 py-3">
      <p dir="auto" className="min-w-0 flex-1">{text}</p>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-glow hover:bg-glow-soft"
      >
        <Copy size={16} weight="bold" /> {copied ? t.friend.copied : t.friend.copy}
      </button>
    </li>
  );
}
