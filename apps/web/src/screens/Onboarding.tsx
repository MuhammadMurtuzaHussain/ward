// First run: meet Ward, pick an age band and a look, and hear the promise. No account, no
// email, no gender question. Everything here can be changed later in Me.

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, EyeSlash, LockKey, PaperPlaneTilt, Warning } from "@phosphor-icons/react";
import { Ghost, type Mood } from "../components/Ghost.tsx";
import { Button } from "../components/ui.tsx";
import { AGES, LOOKS } from "../lib/looks.ts";
import { applyLook, updateProfile, useStore, type AgeBand, type LookId } from "../lib/store.ts";

const STEPS = ["hello", "name", "age", "look", "promise"] as const;

export function Onboarding() {
  const p = useStore((s) => s.profile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(p.name);
  const reduce = useReducedMotion();
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const mood: Mood = ["happy", "think", "happy", "cheer", "calm"][step] as Mood;

  return (
    <main className="mx-auto grid min-h-[100dvh] w-full max-w-5xl grid-rows-[auto_1fr] px-4 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:grid-rows-1 lg:items-center lg:gap-16">
      <div className="flex justify-center pt-10 lg:pt-0">
        <Ghost mood={mood} size={step === 0 ? 168 : 120} label="Ward, a friendly ghost" className="lg:!w-[220px] lg:!h-[257px]" />
      </div>

      <div className="pb-10 pt-8 lg:py-16">
        <div className="mb-8 flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? "w-8 bg-glow" : "w-4 bg-raised"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {STEPS[step] === "hello" && (
              <>
                <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Hi. I'm Ward.</h1>
                <p className="mt-4 max-w-[34ch] text-lg leading-relaxed text-dim">
                  When chats get mean, I help you see what's going on and what to do next. I live on this device, and I never send your messages anywhere.
                </p>
                <Button className="mt-8 w-full sm:w-auto" onClick={next}>
                  Hi Ward
                </Button>
              </>
            )}

            {STEPS[step] === "name" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfile({ name: name.trim() });
                  next();
                }}
              >
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">What should I call you?</h1>
                <label htmlFor="name" className="mt-6 block text-sm font-bold text-dim">
                  Your name or a nickname
                </label>
                <input
                  id="name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  autoComplete="off"
                  className="mt-2 w-full rounded-btn border border-line bg-surface px-4 py-3.5 text-lg text-ink placeholder:text-dim/70 focus:border-glow focus:outline-none"
                  placeholder="Ayesha"
                />
                <p className="mt-2 text-sm text-dim">It stays on this device. It helps me spot your name in group chats.</p>
                <div className="mt-8 flex gap-3">
                  <Button type="submit" className="flex-1 sm:flex-none">
                    {name.trim() ? "That's me" : "Skip"}
                  </Button>
                </div>
              </form>
            )}

            {STEPS[step] === "age" && (
              <>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How old are you?</h1>
                <p className="mt-3 text-dim">So I talk to you the right way.</p>
                <div className="mt-6 grid gap-3">
                  {AGES.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        updateProfile({ age: a.id as AgeBand });
                        next();
                      }}
                      className={`flex min-h-16 items-center justify-between rounded-card border px-5 py-4 text-left transition-colors ${
                        p.age === a.id ? "border-glow bg-glow-soft" : "border-line bg-surface hover:border-dim/40"
                      }`}
                    >
                      <span>
                        <span className="block font-display text-xl font-semibold">{a.label}</span>
                        <span className="text-sm text-dim">{a.line}</span>
                      </span>
                      {p.age === a.id && <Check size={22} weight="bold" className="text-glow" />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {STEPS[step] === "look" && (
              <>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Pick your night light</h1>
                <p className="mt-3 text-dim">You can change it whenever you like.</p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {LOOKS.map((l) => (
                    <LookTile
                      key={l.id}
                      look={l}
                      active={p.look === l.id}
                      onPick={() => {
                        updateProfile({ look: l.id as LookId });
                        applyLook({ look: l.id as LookId, age: p.age });
                      }}
                    />
                  ))}
                </div>
                <Button className="mt-8 w-full sm:w-auto" onClick={next}>
                  Keep this one
                </Button>
              </>
            )}

            {STEPS[step] === "promise" && (
              <>
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">My promise to you</h1>
                <ul className="mt-6 grid gap-4">
                  <Promise icon={<EyeSlash size={22} weight="bold" />} title="Nobody reads your chats">
                    Not your parents, not a company, not me on a server. I read them right here and forget them unless you save them.
                  </Promise>
                  <Promise icon={<PaperPlaneTilt size={22} weight="bold" />} title="I never send anything for you">
                    I can write a message to someone you trust. You decide if it goes.
                  </Promise>
                  <Promise icon={<LockKey size={22} weight="bold" />} title="Your evidence is locked">
                    What you save is locked with a PIN only you know.
                  </Promise>
                  <Promise icon={<Warning size={22} weight="bold" />} title="One thing I always do" tone="alarm">
                    If a chat says someone wants to hurt you, or tells you to hurt yourself, I'll show you who to call straight away. I still won't tell anyone myself.
                  </Promise>
                </ul>
                <Button className="mt-8 w-full sm:w-auto" onClick={() => updateProfile({ onboarded: true })}>
                  Got it
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function Promise({ icon, title, children, tone }: { icon: ReactNode; title: string; children: ReactNode; tone?: "alarm" }) {
  return (
    <li className="flex gap-4">
      <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${tone === "alarm" ? "bg-alarm-soft text-alarm" : "bg-glow-soft text-glow"}`}>{icon}</span>
      <span>
        <span className="block font-display text-lg font-semibold">{title}</span>
        <span className="text-dim">{children}</span>
      </span>
    </li>
  );
}

export function LookTile({ look, active, onPick }: { look: (typeof LOOKS)[number]; active: boolean; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-card border-2 p-3 text-left transition-transform active:scale-[0.98] ${active ? "border-glow" : "border-transparent"}`}
      style={{ background: look.bg }}
    >
      <div className="relative h-20 overflow-hidden rounded-[calc(var(--r-card)-8px)]" style={{ background: look.raised }}>
        <div className="absolute -right-6 -top-8 size-24 rounded-full blur-2xl" style={{ background: look.glow, opacity: 0.55 }} />
        <div className="absolute bottom-3 left-3 h-2 w-14 rounded-full" style={{ background: look.glow }} />
        <div className="absolute bottom-7 left-3 h-2 w-9 rounded-full opacity-40" style={{ background: look.id === "daylight" ? "#17183a" : "#fff" }} />
      </div>
      <span className="mt-3 block font-display font-semibold" style={{ color: look.id === "daylight" ? "#17183a" : "#f4f0e8" }}>
        {look.name}
      </span>
      <span className="block text-xs leading-snug" style={{ color: look.id === "daylight" ? "#50536f" : "#b4b3c8" }}>
        {look.line}
      </span>
      {active && (
        <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full" style={{ background: look.glow, color: look.bg }}>
          <Check size={14} weight="bold" />
        </span>
      )}
    </button>
  );
}

