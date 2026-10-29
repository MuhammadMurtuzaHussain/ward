import { useEffect, useState } from "react";
import { ArrowLeft, FilePdf, LockKey, LockSimpleOpen, Trash, Vault as VaultIcon } from "@phosphor-icons/react";
import { Ghost } from "../components/Ghost.tsx";
import { LevelPill } from "../components/LevelPill.tsx";
import { PinPad } from "../components/PinPad.tsx";
import { Button, Screen } from "../components/ui.tsx";
import { ReportDialog } from "../components/ReportDialog.tsx";
import { go } from "../lib/store.ts";
import { locale, useT } from "../i18n/index.ts";
import { hasPin, isUnlocked, list, lock, remove, unlock, type VaultItem } from "../lib/vault.ts";
import { Timeline } from "./Result.tsx";

export function VaultScreen() {
  const t = useT();
  const [open, setOpen] = useState(isUnlocked());
  const [items, setItems] = useState<VaultItem[] | null>(null);
  const [viewing, setViewing] = useState<VaultItem | null>(null);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (open) list().then(setItems, () => setOpen(false));
  }, [open]);

  if (!hasPin())
    return (
      <Screen>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t.vault.title}</h1>
        <div className="mt-10 flex flex-col items-center text-center">
          <Ghost mood="calm" size={110} />
          <p className="mt-6 max-w-[40ch] text-lg">{t.vault.empty}</p>
          <p className="mt-2 max-w-[44ch] text-dim">{t.vault.emptyLine}</p>
          <Button className="mt-6" onClick={() => go({ name: "check" })}>
            {t.home.checkChat}
          </Button>
        </div>
      </Screen>
    );

  if (!open)
    return (
      <Screen>
        <div className="mt-8">
          <PinPad title={t.vault.unlock} hint={t.vault.unlockHint} onDone={async (p) => (await unlock(p)) && (setOpen(true), true)} />
        </div>
      </Screen>
    );

  if (viewing)
    return (
      <Screen wide>
        <div className="mb-4 flex min-h-12 flex-wrap items-center gap-2">
          <button onClick={() => setViewing(null)} className="-ms-2 grid size-11 place-items-center rounded-full text-dim hover:bg-raised" aria-label={t.common.back}>
            <ArrowLeft size={22} weight="bold" className="flip-rtl" />
          </button>
          <h1 className="font-display text-lg font-semibold">{viewing.title}</h1>
          <div className="ms-auto flex gap-2">
            <Button tone="quiet" onClick={() => setReporting(true)}>
              <FilePdf size={20} weight="bold" /> {t.vault.makeReport}
            </Button>
          </div>
        </div>
        <p className="mb-4 text-sm text-dim">{t.vault.savedAt(new Date(viewing.savedAt).toLocaleString(locale()))}</p>
        <Timeline analysis={viewing.analysis} self={viewing.self} />
        {reporting && <ReportDialog item={viewing} onClose={() => setReporting(false)} />}
        <button
          className="mt-8 flex min-h-11 items-center gap-2 text-sm font-bold text-alarm"
          onClick={async () => {
            if (!confirm(t.vault.delConfirm)) return;
            await remove(viewing.id);
            setViewing(null);
            setItems(await list());
          }}
        >
          <Trash size={18} weight="bold" /> {t.vault.del}
        </button>
      </Screen>
    );

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t.vault.title}</h1>
        <Button
          tone="ghost"
          onClick={() => {
            lock();
            setOpen(false);
            setItems(null);
          }}
        >
          <LockKey size={20} weight="bold" /> {t.vault.lock}
        </Button>
      </div>
      <p className="mt-2 flex items-center gap-2 text-dim">
        <LockSimpleOpen size={18} /> {t.vault.openUntil}
      </p>
      {items === null ? (
        <div className="mt-6 grid gap-3" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-dim">{t.vault.nothing}</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {items.map((it) => (
            <li key={it.id}>
              <button onClick={() => setViewing(it)} className="flex w-full items-center gap-4 rounded-card border border-line bg-surface p-4 text-start hover:border-dim/40">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-glow-soft text-glow">
                  <VaultIcon size={22} weight="bold" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-semibold">{it.title}</span>
                  <span className="text-sm text-dim">
                    {t.vault.summary(it.analysis.findings.filter((f) => f.severity > 0).length, it.chat.messages.length, new Date(it.savedAt).toLocaleDateString(locale()))}
                  </span>
                </span>
                <LevelPill level={it.analysis.level} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
