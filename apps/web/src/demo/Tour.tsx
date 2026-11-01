// The hosted demo's guided tour: one sample chat, step by step, pointing at the screen while
// saying which layer is reading it right now (word lists, Ward Lite, the whole chat, Gemma).
// Steps that wait on Ward (the close read, the Gemma read) offer "Next" once it's done.

import { useEffect, useState, useSyncExternalStore } from "react";
import { X } from "@phosphor-icons/react";
import { getState, tab, updateProfile, useStore } from "../lib/store.ts";
import { DEMO_GEMMA_URL } from "../lib/demoGemma.ts";
import { useT } from "../i18n/index.ts";
import { Button } from "../components/ui.tsx";
import { DEMO } from "./demo.ts";

type StepId = "intro" | "samples" | "lists" | "lite" | "chat" | "messages" | "gemma" | "how" | "end";
// Which part of the screen each step points at (a data-tour attribute), if any.
const TARGET: Partial<Record<StepId, string>> = {
  samples: "pileon",
  lists: "verdict",
  lite: "verdict",
  chat: "verdict",
  messages: "timeline",
  gemma: "gemma",
  how: "how",
};
const STEPS: StepId[] = ["intro", "samples", "lists", "lite", "chat", "messages", "gemma", "how", "end"];

let current: number | null = null;
const listeners = new Set<() => void>();
function setStep(i: number | null) {
  current = i;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

export function startTour() {
  // The tour starts on Check, so a first-time visitor skips the welcome screens.
  if (!getState().profile.onboarded) updateProfile({ onboarded: true });
  setStep(0);
}

export function Tour() {
  const t = useT();
  const i = useSyncExternalStore(subscribe, () => current);
  const screen = useStore((s) => s.screen);
  const session = useStore((s) => (s.screen.name === "result" ? s.sessions[s.screen.id] : undefined));
  const [, redraw] = useState(0);
  const step = i === null ? null : STEPS[i]!;
  const readByGemma = !!session?.analysis.layers.models.some((m) => /gemma/i.test(m));

  // Picking a sample moves the tour on by itself.
  useEffect(() => {
    if (i !== null && step === "samples" && screen.name === "result") setStep(i + 1);
  }, [i, step, screen]);

  // Skip the Gemma step where there's no Gemma relay, or nothing to offer it on.
  useEffect(() => {
    if (step !== "gemma" || !session || session.refining) return;
    if (!DEMO_GEMMA_URL || (!readByGemma && !document.querySelector('[data-tour="gemma"]'))) setStep(i! + 1);
  }, [step, session, readByGemma, i]);

  // Point at this step's part of the screen; it may only appear a moment later.
  useEffect(() => {
    const name = step && TARGET[step];
    if (!name) return;
    let el: Element | null = null;
    const find = () => {
      el = document.querySelector(`[data-tour="${name}"]`);
      if (!el) return false;
      el.setAttribute("data-tour-on", "");
      el.scrollIntoView({ block: "start", behavior: "smooth" });
      redraw((n) => n + 1);
      return true;
    };
    const timer = find() ? undefined : window.setInterval(() => find() && window.clearInterval(timer), 250);
    return () => {
      window.clearInterval(timer);
      el?.removeAttribute("data-tour-on");
    };
  }, [step, screen]);

  if (!DEMO || i === null || !step) return null;
  const copy = t.demo.tour.steps[step];
  const waiting = (step === "samples" && screen.name !== "result") || (step === "lite" && session?.refining) || (step === "gemma" && ((!readByGemma && !session?.modelError) || session?.refining));
  const next = () => {
    if (step === "intro") tab({ name: "check" });
    setStep(i + 1 < STEPS.length ? i + 1 : null);
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-title"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md lg:inset-x-auto lg:end-6 lg:w-[26rem] rounded-card border border-glow bg-surface p-5 shadow-[0_20px_60px_-15px_var(--halo)] lg:bottom-6"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-glow">{t.demo.tour.count(i + 1, STEPS.length)}</p>
        <button onClick={() => setStep(null)} aria-label={t.demo.tour.close} className="-m-2 p-2 text-dim hover:text-ink">
          <X size={18} weight="bold" />
        </button>
      </div>
      <h2 id="tour-title" className="mt-1 font-display text-lg font-bold tracking-tight">
        {copy[0]}
      </h2>
      <p aria-live="polite" className="mt-1 text-sm text-dim">
        {copy[1]}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        {i > 0 && step !== "end" ? (
          <button onClick={() => setStep(null)} className="text-sm font-bold text-dim hover:text-ink">
            {t.demo.tour.close}
          </button>
        ) : (
          <span />
        )}
        {waiting ? (
          <span className="flex items-center gap-2 text-sm font-bold text-glow">
            <span className="size-2 animate-pulse rounded-full bg-glow" aria-hidden />
            {step === "lite" || (step === "gemma" && session?.refining) ? t.demo.tour.reading : t.demo.tour.yourTurn}
          </span>
        ) : (
          <Button className="min-h-11" onClick={next}>
            {step === "intro" ? t.demo.tour.start : step === "end" ? t.demo.tour.done : t.demo.tour.next}
          </Button>
        )}
      </div>
      {step === "gemma" && waiting && !session?.refining && (
        <button onClick={next} className="mt-3 text-sm font-bold text-dim underline hover:text-ink">
          {t.demo.tour.skip}
        </button>
      )}
    </aside>
  );
}
