// "Save to vault" with the PIN steps inline: create one the first time, unlock after that.
// If saving fails (storage full or blocked), the child is told calmly and can try again.
// The first time, if Ward itself isn't locked, it offers to lock Ward with the same PIN: on a
// shared phone the vault is safe, but anyone could still open Ward and delete it.

import { useRef, useState } from "react";
import { ArrowClockwise, CheckCircle, LockKey } from "@phosphor-icons/react";
import { Button } from "./ui.tsx";
import { Dialog } from "./Dialog.tsx";
import { PinPad } from "./PinPad.tsx";
import { createPin, hasPin, isUnlocked, save, unlock } from "../lib/vault.ts";
import { activeEntry, setProfilePin, useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

export function SaveToVault({ id }: { id: string }) {
  const t = useT();
  const s = useStore((st) => st.sessions[id]);
  const saved = useStore((st) => st.profile.checks.find((c) => c.id === id)?.saved ?? false);
  const [step, setStep] = useState<null | "create" | "confirm" | "unlock" | "failed" | "lockToo">(null);
  const [first, setFirst] = useState("");
  // The new PIN, held only until the child answers "lock Ward with it too?".
  const fresh = useRef<string | null>(null);

  function done() {
    fresh.current = null;
    setFirst("");
    setStep(null);
  }

  /** Runs one vault step; a throw shows the calm "didn't save" panel instead of failing silently. */
  async function attempt(fn: () => Promise<boolean | void>) {
    try {
      return await fn();
    } catch {
      setStep("failed");
    }
  }

  async function saveNow() {
    if (!s) return;
    await save({ id, title: s.title, self: s.self, chat: s.chat, analysis: s.analysis });
    if (fresh.current && !activeEntry()?.pinHash) setStep("lockToo");
    else done();
  }

  function start() {
    if (!hasPin()) setStep("create");
    else if (!isUnlocked()) setStep("unlock");
    else void attempt(saveNow);
  }

  if (saved && step !== "lockToo")
    return (
      <Button tone="quiet" disabled>
        <CheckCircle size={20} weight="fill" className="text-safe" /> {t.vault.saved}
      </Button>
    );

  return (
    <>
      <Button tone="quiet" onClick={start}>
        <LockKey size={20} weight="bold" /> {t.vault.save}
      </Button>
      <Dialog open={!!step} onClose={done} label={t.vault.save} labelledBy={step === "lockToo" ? "lock-too" : undefined}>
        {step === "create" && (
          <PinPad
            title={t.vault.makePin}
            hint={t.vault.makePinHint}
            onDone={(p) => {
              setFirst(p);
              setStep("confirm");
            }}
          />
        )}
        {step === "confirm" && (
          <PinPad
            key="confirm"
            title={t.vault.again}
            hint={t.vault.againHint}
            onDone={async (p) => {
              if (p !== first) {
                setStep("create");
                return false;
              }
              await attempt(async () => {
                await createPin(p);
                fresh.current = p;
                await saveNow();
              });
            }}
          />
        )}
        {step === "unlock" && (
          <PinPad
            title={t.vault.unlock}
            onDone={(p) =>
              attempt(async () => {
                if (!(await unlock(p))) return false;
                await saveNow();
              })
            }
          />
        )}
        {step === "failed" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <p role="alert" dir="auto" className="text-lg">{t.vault.saveFailed}</p>
            <Button onClick={start}>
              <ArrowClockwise size={20} weight="bold" /> {t.vault.tryAgain}
            </Button>
          </div>
        )}
        {step === "lockToo" && (
          <div className="flex flex-col items-center text-center">
            <CheckCircle size={40} weight="fill" className="text-safe" />
            <h2 id="lock-too" dir="auto" className="mt-3 font-display text-2xl font-bold tracking-tight">
              {t.vault.lockToo[0]}
            </h2>
            <p dir="auto" className="mt-2 text-dim">{t.vault.lockToo[1]}</p>
            <div className="mt-6 grid w-full gap-3">
              <Button
                data-autofocus
                onClick={async () => {
                  if (fresh.current) await setProfilePin(fresh.current);
                  done();
                }}
              >
                <LockKey size={20} weight="bold" /> {t.vault.lockTooYes}
              </Button>
              <Button tone="quiet" onClick={done}>
                {t.vault.lockTooNo}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
