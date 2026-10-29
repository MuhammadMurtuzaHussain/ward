import { useEffect, useState } from "react";
import { ArrowRight, ChalkboardTeacher, Cpu, HandHeart, LockKey, SpeakerHigh, Translate, Trash, UserCircle, UsersThree } from "@phosphor-icons/react";
import { STARTER_PACKS } from "@ward/engine";
import { Button, Card, Pill, Screen } from "../components/ui.tsx";
import { PinPad } from "../components/PinPad.tsx";
import { AGES, LOOKS } from "../lib/looks.ts";
import { modelStatus, type ModelStatus } from "../lib/run.ts";
import { activeEntry, go, lockProfile, removeActiveProfile, setHideRecents, setProfilePin, updateProfile, useStore, type AgeBand, type Lang } from "../lib/store.ts";
import { wipe } from "../lib/vault.ts";
import { LookTile } from "./Onboarding.tsx";
import { PhoneGemmaCard } from "../components/PhoneGemmaCard.tsx";
import { useT } from "../i18n/index.ts";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" className="size-5 accent-[var(--glow)]" checked={on} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Me() {
  const p = useStore((s) => s.profile);
  const profiles = useStore((s) => s.profiles);
  const t = useT();
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [settingPin, setSettingPin] = useState(false);
  const hasPin = !!activeEntry()?.pinHash;

  useEffect(() => {
    modelStatus().then(setStatus);
  }, [p.ollamaUrl, p.model]);

  return (
    <Screen wide>
      <h1 className="font-display text-3xl font-bold tracking-tight">{t.me.title}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <UserCircle size={22} weight="bold" className="text-glow" /> {t.me.you}
          </h2>
          <label htmlFor="me-name" className="mt-4 block text-sm font-bold text-dim">
            {t.me.name}
          </label>
          <input
            id="me-name"
            value={p.name}
            dir="auto"
            onChange={(e) => updateProfile({ name: e.target.value.slice(0, 30) })}
            className="mt-1.5 w-full rounded-btn border border-line bg-bg px-4 py-3 text-ink focus:border-glow focus:outline-none"
          />
          <p className="mt-4 text-sm font-bold text-dim">{t.me.age}</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {AGES.map((a) => (
              <button
                key={a.id}
                onClick={() => updateProfile({ age: a.id as AgeBand })}
                aria-pressed={p.age === a.id}
                className={`min-h-12 rounded-btn text-sm font-bold ${p.age === a.id ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}
              >
                {t.ages[a.id]![0]}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-bold text-dim">{t.me.language}</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(
              [
                ["en", "English"],
                ["ur", "اردو"],
              ] as [Lang, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                lang={id}
                onClick={() => updateProfile({ lang: id })}
                aria-pressed={p.lang === id}
                className={`min-h-12 rounded-btn text-sm font-bold ${p.lang === id ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <h3 className="mt-5 flex items-center gap-2 text-sm font-bold text-dim">
            <SpeakerHigh size={18} weight="bold" className="text-glow" /> {t.me.readAloud}
          </h3>
          <Toggle on={p.readAloud} onChange={(v) => updateProfile({ readAloud: v })} label={t.me.readAloudLine} />
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <UsersThree size={22} weight="bold" className="text-glow" /> {t.me.privacy}
          </h2>
          <p className="mt-2 text-sm text-dim">{t.profiles.sharedPhoneLine}</p>
          {settingPin ? (
            <div className="mt-4">
              <PinPad
                title={t.profiles.newPin}
                onDone={async (pin) => {
                  await setProfilePin(pin);
                  setSettingPin(false);
                }}
              />
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {hasPin ? (
                <Button tone="quiet" onClick={() => setProfilePin(null)}>
                  <LockKey size={18} weight="bold" /> {t.profiles.removePin}
                </Button>
              ) : (
                <Button onClick={() => setSettingPin(true)}>
                  <LockKey size={18} weight="bold" /> {t.profiles.setPin}
                </Button>
              )}
              <Button tone="quiet" onClick={lockProfile}>
                <UsersThree size={18} weight="bold" /> {t.profiles.switch}
              </Button>
            </div>
          )}
          <Toggle on={profiles.hideRecents} onChange={setHideRecents} label={t.profiles.hideRecents} />
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Cpu size={22} weight="bold" className="text-glow" /> {t.me.ai}
          </h2>
          <p className="mt-2 text-sm text-dim">{t.me.aiLine}</p>
          <div className="mt-3">
            {status === null ? <Pill>{t.me.checking}</Pill> : status.ok ? <Pill tone="safe">{t.me.ready(status.model)}</Pill> : <Pill tone="glow">{t.me.notReady(status.reason)}</Pill>}
          </div>
          <label htmlFor="model" className="mt-4 block text-sm font-bold text-dim">
            {t.me.model}
          </label>
          <input
            id="model"
            dir="ltr"
            value={p.model}
            onChange={(e) => updateProfile({ model: e.target.value.trim() })}
            className="mt-1.5 w-full rounded-btn border border-line bg-bg px-4 py-3 font-mono text-sm text-ink focus:border-glow focus:outline-none"
          />
          <label htmlFor="url" className="mt-3 block text-sm font-bold text-dim">
            {t.me.address}
          </label>
          <input
            id="url"
            dir="ltr"
            value={p.ollamaUrl}
            onChange={(e) => updateProfile({ ollamaUrl: e.target.value.trim() })}
            className="mt-1.5 w-full rounded-btn border border-line bg-bg px-4 py-3 font-mono text-sm text-ink focus:border-glow focus:outline-none"
          />
          <p className="mt-2 text-xs text-dim">{t.me.addressHint}</p>
        </Card>
        <PhoneGemmaCard />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold tracking-tight">{t.me.adults}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button onClick={() => go({ name: "adults" })} className="flex items-center gap-4 rounded-card border border-line bg-surface p-5 text-start hover:border-dim/40">
            <HandHeart size={28} weight="bold" className="shrink-0 text-glow" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-bold">{t.me.adultGuide[0]}</span>
              <span className="text-sm text-dim">{t.me.adultGuide[1]}</span>
            </span>
            <ArrowRight size={18} weight="bold" className="flip-rtl text-glow" />
          </button>
          <button onClick={() => go({ name: "teach" })} className="flex items-center gap-4 rounded-card border border-line bg-surface p-5 text-start hover:border-dim/40">
            <ChalkboardTeacher size={28} weight="bold" className="shrink-0 text-glow" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-bold">{t.me.teach[0]}</span>
              <span className="text-sm text-dim">{t.me.teach[1]}</span>
            </span>
            <ArrowRight size={18} weight="bold" className="flip-rtl text-glow" />
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold tracking-tight">{t.me.look}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LOOKS.map((l) => (
            <LookTile key={l.id} look={l} active={p.look === l.id} onPick={() => updateProfile({ look: l.id })} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <Translate size={22} weight="bold" className="text-glow" /> {t.me.languages}
        </h2>
        <p className="mt-2 max-w-[60ch] text-dim">{t.me.languagesLine}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTER_PACKS.map((pk) => (
            <Pill key={pk.lang}>
              {pk.name} <span className="font-normal">{t.me.words(pk.entries.length)}</span>
            </Pill>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-bold tracking-tight">{t.me.startOver}</h2>
        <p className="mt-2 max-w-[56ch] text-dim">{t.me.startOverLine}</p>
        <Button
          tone="quiet"
          className="mt-4 text-alarm"
          onClick={async () => {
            if (!confirm(t.me.deleteConfirm)) return;
            await wipe();
            removeActiveProfile();
          }}
        >
          <Trash size={20} weight="bold" /> {t.me.deleteAll}
        </Button>
      </section>
    </Screen>
  );
}
