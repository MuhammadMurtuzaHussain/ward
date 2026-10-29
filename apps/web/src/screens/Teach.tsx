// Class mode: a teacher projects a Resilience Path lesson for the whole room. One exercise at a
// time, big type, the class votes or talks, then the teacher reveals the answer. Nothing is
// recorded: no names, no accounts, no scores. Whole-school work is where anti-bullying programs
// show their clearest effects, so the same lessons a child plays alone also run in a classroom.

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChalkboardTeacher, ChatsTeardrop, Eye, Printer, ShieldCheck, X } from "@phosphor-icons/react";
import { lessonById, unitsFor, type Exercise } from "@ward/lessons";
import { Ghost } from "../components/Ghost.tsx";
import { BackBar, Button, Screen } from "../components/ui.tsx";
import { UnitIcon } from "../components/UnitIcon.tsx";
import { AGES } from "../lib/looks.ts";
import { back, go, useStore, type AgeBand } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";
import { KIT } from "../lib/kit.ts";



export function Teach() {
  const t = useT();
  const lang = useStore((s) => s.profile.lang);
  const [age, setAge] = useState<AgeBand>("11");
  return (
    <Screen wide>
      <BackBar title={t.teach.title} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-card border border-line bg-surface p-6">
          <ChalkboardTeacher size={32} weight="bold" className="text-glow" />
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">{t.teach.heading}</h1>
          <p className="mt-2 text-dim">
            {t.teach.line}
          </p>
          <h2 className="mt-6 flex items-center gap-2 font-display font-bold">
            <ShieldCheck size={20} weight="bold" className="text-glow" /> {t.teach.agree}
          </h2>
          <ul className="mt-2 grid list-disc gap-1.5 ps-5 text-dim marker:text-glow">
            {t.teach.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-dim">
            {t.teach.after}
          </p>
          <button onClick={() => go({ name: "kit" })} className="mt-6 flex w-full items-center gap-4 rounded-card border border-glow/40 bg-glow-soft p-4 text-start">
            <Printer size={24} weight="bold" className="shrink-0 text-glow" />
            <span className="min-w-0 flex-1">
              <span className="block font-display font-bold">{KIT[lang].open}</span>
              <span className="text-sm text-dim">{KIT[lang].openLine}</span>
            </span>
            <ArrowRight size={18} weight="bold" className="flip-rtl shrink-0 text-glow" />
          </button>
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-dim">{t.teach.classAge}</span>
            {AGES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAge(a.id)}
                aria-pressed={age === a.id}
                className={`min-h-10 rounded-full px-4 text-sm font-bold ${age === a.id ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}
              >
                {t.ages[a.id]![0]}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4">
            {unitsFor(age, lang).map((u) => (
              <div key={u.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-glow-soft text-glow">
                    <UnitIcon icon={u.icon} size={18} />
                  </span>
                  <h2 className="font-display text-lg font-bold">{u.title}</h2>
                </div>
                <ul className="mt-3 grid gap-2">
                  {u.lessons.map((l) => (
                    <li key={l.id}>
                      <button onClick={() => go({ name: "teachLesson", id: l.id })} className="flex w-full items-center gap-3 rounded-btn bg-raised px-4 py-3 text-start hover:bg-[color-mix(in_srgb,var(--raised),var(--ink)_6%)]">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{l.title}</span>
                          <span className="text-sm text-dim">{t.teach.questions(l.exercises.length, l.line)}</span>
                        </span>
                        <ArrowRight size={18} weight="bold" className="flip-rtl text-glow" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}



export function TeachLesson({ id }: { id: string }) {
  const t = useT();
  const lang = useStore((s) => s.profile.lang);
  const found = lessonById(id, lang);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const total = found?.lesson.exercises.length ?? 0;
  const done = i >= total;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (!shown && !done) setShown(true);
        else if (!done) {
          setShown(false);
          setI((x) => x + 1);
        }
      }
      if (e.key === "ArrowLeft" && i > 0) {
        setShown(false);
        setI((x) => x - 1);
      }
      if (e.key === "Escape") back({ name: "teach" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, done, i]);

  if (!found) return null;
  const ex = found.lesson.exercises[i];

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-6 py-6 sm:px-10">
      <header className="flex items-center gap-4">
        <button onClick={() => back({ name: "teach" })} className="grid size-11 place-items-center rounded-full text-dim hover:bg-raised" aria-label={t.teach.end}>
          <X size={24} weight="bold" />
        </button>
        <p className="font-display font-semibold text-dim">
          {found.unit.title}: {found.lesson.title}
        </p>
        <p className="ms-auto text-sm font-bold text-dim">{done ? t.teach.finished : t.teach.of(i + 1, total)}</p>
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        {done ? (
          <div className="flex flex-col items-center text-center">
            <Ghost mood="cheer" size={150} />
            <h1 className="mt-6 font-display text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-tight">{t.teach.thatsIt}</h1>
            <p className="mt-3 max-w-[50ch] text-[clamp(1.1rem,2vw,1.5rem)] text-dim">
              {t.teach.thatsItLine}
            </p>
          </div>
        ) : ex ? (
          <ClassExercise ex={ex} shown={shown} />
        ) : null}
      </div>

      {!done && (
        <footer className="grid gap-4 border-t border-line pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="flex items-start gap-3 text-[clamp(1rem,1.6vw,1.25rem)]">
            <ChatsTeardrop size={26} weight="bold" className="mt-0.5 shrink-0 text-glow" />
            {ex ? t.teach.talk[ex.kind] : ""}
          </p>
          <div className="flex gap-2">
            <Button tone="quiet" disabled={i === 0} onClick={() => (setShown(false), setI(i - 1))} aria-label={t.teach.prev}>
              <ArrowLeft size={20} weight="bold" className="flip-rtl" />
            </Button>
            {!shown ? (
              <Button onClick={() => setShown(true)}>
                <Eye size={20} weight="bold" /> {t.teach.reveal}
              </Button>
            ) : (
              <Button onClick={() => (setShown(false), setI(i + 1))}>
                {t.teach.next} <ArrowRight size={20} weight="bold" className="flip-rtl" />
              </Button>
            )}
          </div>
        </footer>
      )}
    </main>
  );
}

const BIG = "font-display text-[clamp(1.8rem,4.2vw,3.25rem)] font-bold leading-[1.15] tracking-tight";
const MID = "text-[clamp(1.1rem,2.1vw,1.6rem)]";

function ClassExercise({ ex, shown }: { ex: Exercise; shown: boolean }) {
  const t = useT();
  const why = "why" in ex ? ex.why : "";
  switch (ex.kind) {
    case "truefalse":
      return (
        <div>
          <p className={`${MID} font-bold text-glow`}>{t.lesson.trueFalse}</p>
          <h1 className={`${BIG} mt-3`}>{ex.statement}</h1>
          {shown && <Answer title={ex.answer ? t.lesson.true : t.lesson.false} why={why} />}
        </div>
      );
    case "choose":
      return (
        <div>
          <h1 className={BIG}>{ex.prompt}</h1>
          <ol className="mt-8 grid gap-3">
            {ex.options.map((o, k) => (
              <li
                key={o.text}
                className={`flex gap-4 rounded-card border-2 px-6 py-4 ${MID} ${shown ? (o.right ? "border-safe bg-[color-mix(in_srgb,var(--safe),transparent_88%)]" : "border-line opacity-60") : "border-line bg-surface"}`}
              >
                <span className="font-display font-bold text-glow">{String.fromCharCode(65 + k)}</span>
                {o.text}
              </li>
            ))}
          </ol>
          {shown && <Answer why={ex.options.find((o) => o.right)!.why} />}
        </div>
      );
    case "spot":
      return (
        <div>
          <h1 className={BIG}>{ex.prompt}</h1>
          <ol className="mt-8 grid max-w-3xl gap-3">
            {ex.chat.map((l, k) => (
              <li key={k} className={`rounded-card px-6 py-3 ${MID} ${shown && l.flag ? "bg-alarm-soft ring-2 ring-alarm" : "bg-surface"}`}>
                <span className="block text-[0.7em] font-bold text-dim">{l.from}</span>
                {l.text}
              </li>
            ))}
          </ol>
          {shown && <Answer why={why} />}
        </div>
      );
    case "sort":
      return (
        <div>
          <h1 className={BIG}>{ex.prompt}</h1>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {shown
              ? ex.bins.map((b, bi) => (
                  <div key={b} className="rounded-card border border-line bg-surface p-5">
                    <p className={`${MID} font-display font-bold text-glow`}>{b}</p>
                    <ul className="mt-3 grid gap-2">
                      {ex.items.filter((it) => it.bin === bi).map((it) => (
                        <li key={it.text} className={MID}>
                          {it.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              : ex.items.map((it) => (
                  <div key={it.text} className={`rounded-card bg-surface px-6 py-4 ${MID}`}>
                    {it.text}
                  </div>
                ))}
          </div>
          {shown && <Answer why={why} />}
        </div>
      );
    case "write":
      return (
        <div>
          <h1 className={BIG}>{ex.prompt}</h1>
          {shown && <Answer title={t.teach.oneWay} why={`"${ex.example}"`} />}
        </div>
      );
  }
}

function Answer({ title, why }: { title?: string; why: string }) {
  return (
    <div className="mt-8 flex max-w-4xl gap-5 rounded-card border border-glow/40 bg-glow-soft p-6">
      <Ghost mood="cheer" size={64} className="hidden shrink-0 sm:inline-grid" />
      <div>
        {title && <p className={`${MID} font-display font-bold text-glow`}>{title}</p>}
        <p className={MID}>{why}</p>
      </div>
    </div>
  );
}
