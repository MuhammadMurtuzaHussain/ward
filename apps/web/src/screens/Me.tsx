import { useEffect, useState } from "react";
import { Cpu, Translate, Trash, UserCircle } from "@phosphor-icons/react";
import { STARTER_PACKS } from "@ward/engine";
import { Button, Card, Pill, Screen } from "../components/ui.tsx";
import { AGES, LOOKS } from "../lib/looks.ts";
import { modelStatus, type ModelStatus } from "../lib/run.ts";
import { updateProfile, useStore, type AgeBand } from "../lib/store.ts";
import { wipe } from "../lib/vault.ts";
import { LookTile } from "./Onboarding.tsx";

export function Me() {
  const p = useStore((s) => s.profile);
  const [status, setStatus] = useState<ModelStatus | null>(null);

  useEffect(() => {
    modelStatus().then(setStatus);
  }, [p.ollamaUrl, p.model]);

  return (
    <Screen wide>
      <h1 className="font-display text-3xl font-bold tracking-tight">Me</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <UserCircle size={22} weight="bold" className="text-glow" /> You
          </h2>
          <label htmlFor="me-name" className="mt-4 block text-sm font-bold text-dim">
            Name or nickname
          </label>
          <input
            id="me-name"
            value={p.name}
            onChange={(e) => updateProfile({ name: e.target.value.slice(0, 30) })}
            className="mt-1.5 w-full rounded-btn border border-line bg-bg px-4 py-3 text-ink focus:border-glow focus:outline-none"
          />
          <p className="mt-4 text-sm font-bold text-dim">Age</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {AGES.map((a) => (
              <button
                key={a.id}
                onClick={() => updateProfile({ age: a.id as AgeBand })}
                aria-pressed={p.age === a.id}
                className={`min-h-12 rounded-btn text-sm font-bold ${p.age === a.id ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Cpu size={22} weight="bold" className="text-glow" /> AI on this device
          </h2>
          <p className="mt-2 text-sm text-dim">Ward uses Gemma, an open model that runs on your own computer through Ollama. Nothing is sent to the internet.</p>
          <div className="mt-3">
            {status === null ? (
              <Pill>Checking…</Pill>
            ) : status.ok ? (
              <Pill tone="safe">{status.model} is ready</Pill>
            ) : (
              <Pill tone="glow">{status.reason}. Quick checks still work.</Pill>
            )}
          </div>
          <label htmlFor="model" className="mt-4 block text-sm font-bold text-dim">
            Model
          </label>
          <input
            id="model"
            value={p.model}
            onChange={(e) => updateProfile({ model: e.target.value.trim() })}
            className="mt-1.5 w-full rounded-btn border border-line bg-bg px-4 py-3 font-mono text-sm text-ink focus:border-glow focus:outline-none"
          />
          <label htmlFor="url" className="mt-3 block text-sm font-bold text-dim">
            Ollama address
          </label>
          <input
            id="url"
            value={p.ollamaUrl}
            onChange={(e) => updateProfile({ ollamaUrl: e.target.value.trim() })}
            className="mt-1.5 w-full rounded-btn border border-line bg-bg px-4 py-3 font-mono text-sm text-ink focus:border-glow focus:outline-none"
          />
          <p className="mt-2 text-xs text-dim">On a phone, put your own computer's address here (same Wi-Fi) to use its Gemma.</p>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold tracking-tight">Look</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LOOKS.map((l) => (
            <LookTile key={l.id} look={l} active={p.look === l.id} onPick={() => updateProfile({ look: l.id })} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <Translate size={22} weight="bold" className="text-glow" /> Languages Ward knows
        </h2>
        <p className="mt-2 max-w-[60ch] text-dim">Word lists that work with no AI at all. Anyone can add the words kids around them actually use: they're plain files in Ward's code.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTER_PACKS.map((pk) => (
            <Pill key={pk.lang}>
              {pk.name} <span className="font-normal">{pk.entries.length} words</span>
            </Pill>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-bold tracking-tight">Start over</h2>
        <p className="mt-2 max-w-[56ch] text-dim">Deletes your vault, your PIN, your progress and your settings from this device. Use it if you forgot your PIN.</p>
        <Button
          tone="quiet"
          className="mt-4 text-alarm"
          onClick={async () => {
            if (!confirm("Delete everything Ward has on this device? Your saved evidence will be gone for good.")) return;
            await wipe();
            try {
              localStorage.clear();
            } catch {
              // nothing stored
            }
            location.reload();
          }}
        >
          <Trash size={20} weight="bold" /> Delete everything
        </Button>
      </section>
    </Screen>
  );
}
