// A teen safety plan, the shape crisis services use (warning signs, coping on your own, people
// and places, who to ask, a safer space), kept in the vault under the same PIN and saved as the
// teen types. Helplines for their country sit at the bottom. Content to be reviewed by a
// professional before it's switched on for everyone (docs/PHASES.md, Phase 3).

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Plus, X } from "@phosphor-icons/react";
import { Ghost } from "../components/Ghost.tsx";
import { HelpNow } from "../components/HelpNow.tsx";
import { PinPad } from "../components/PinPad.tsx";
import { BackBar, Button, Screen } from "../components/ui.tsx";
import { createPin, emptyPlan, hasPin, isUnlocked, loadPlan, savePlan, unlock, type SafetyPlan as Plan } from "../lib/vault.ts";
import { useT } from "../i18n/index.ts";

const SECTIONS = ["signs", "calm", "places", "people", "space"] as const;
type Section = (typeof SECTIONS)[number];

export function SafetyPlan() {
  const t = useT();
  const [gate, setGate] = useState<"create" | "confirm" | "unlock" | null>(() => (!hasPin() ? "create" : !isUnlocked() ? "unlock" : null));
  const [first, setFirst] = useState("");

  return (
    <Screen>
      <BackBar title={t.plan.title} />
      {gate === "create" && <PinPad title={t.vault.makePin} hint={t.plan.needPin} onDone={(p) => (setFirst(p), setGate("confirm"))} />}
      {gate === "confirm" && (
        <PinPad
          key="confirm"
          title={t.vault.again}
          hint={t.vault.againHint}
          onDone={async (p) => {
            if (p !== first) {
              setGate("create");
              return false;
            }
            await createPin(p);
            setGate(null);
          }}
        />
      )}
      {gate === "unlock" && <PinPad title={t.vault.unlock} hint={t.vault.unlockHint} onDone={async (p) => (await unlock(p)) && (setGate(null), true)} />}
      {gate === null && <Editor />}
    </Screen>
  );
}

function Editor() {
  const t = useT();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    loadPlan().then(setPlan, () => setPlan(emptyPlan()));
    return () => clearTimeout(timer.current);
  }, []);

  function change(next: Plan) {
    setPlan(next);
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await savePlan(next);
      setStatus("saved");
    }, 500);
  }

  if (!plan)
    return (
      <div className="grid gap-3" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-card bg-surface" />
        ))}
      </div>
    );

  return (
    <>
      <div className="flex items-center gap-4">
        <Ghost mood="calm" size={72} className="shrink-0" />
        <p className="text-lg leading-relaxed">{t.plan.intro}</p>
      </div>
      <p role="status" className="mt-4 flex min-h-6 items-center gap-1.5 text-sm text-dim">
        {status === "saving" && t.plan.saving}
        {status === "saved" && (
          <>
            <CheckCircle size={16} weight="fill" className="text-safe" /> {t.plan.saved}
          </>
        )}
      </p>

      <ol className="mt-4 grid gap-5">
        {SECTIONS.map((sec, i) => (
          <SectionCard key={sec} n={i + 1} sec={sec} items={plan[sec]} onChange={(items) => change({ ...plan, [sec]: items })} />
        ))}
      </ol>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight">{t.plan.helplines}</h2>
        <HelpNow />
      </section>
    </>
  );
}

function SectionCard({ n, sec, items, onChange }: { n: number; sec: Section; items: string[]; onChange: (items: string[]) => void }) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const [title, hint] = t.plan.sections[sec];
  const ideas = t.plan.ideas[sec].filter((x) => !items.includes(x));
  const add = (x: string) => {
    const v = x.trim().slice(0, 80);
    if (v && !items.includes(v)) onChange([...items, v]);
  };

  return (
    <li className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-glow-soft font-display text-sm font-bold text-glow">{n}</span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <p className="text-sm text-dim">{hint}</p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((x) => (
            <li key={x} className="flex items-center gap-1 rounded-full bg-glow-soft py-1 ps-3 pe-1 font-semibold">
              <span dir="auto">{x}</span>
              <button onClick={() => onChange(items.filter((y) => y !== x))} aria-label={t.plan.remove(x)} className="grid size-8 place-items-center rounded-full text-dim hover:bg-raised hover:text-ink">
                <X size={14} weight="bold" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add(draft);
          setDraft("");
        }}
      >
        <input
          value={draft}
          dir="auto"
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.plan.addPlaceholder}
          aria-label={`${title}: ${t.plan.addPlaceholder}`}
          className="min-w-0 flex-1 rounded-btn border border-line bg-bg px-4 py-2.5 text-ink placeholder:text-dim/70 focus:border-glow focus:outline-none"
        />
        <Button type="submit" tone="quiet" disabled={!draft.trim()}>
          <Plus size={18} weight="bold" /> {t.plan.add}
        </Button>
      </form>

      {ideas.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-dim">{t.plan.ideasLabel}</span>
          {ideas.map((x) => (
            <button key={x} onClick={() => add(x)} className="flex min-h-9 items-center gap-1 rounded-full border border-dashed border-line px-3 text-sm text-dim hover:border-glow hover:text-ink">
              <Plus size={12} weight="bold" /> {x}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
