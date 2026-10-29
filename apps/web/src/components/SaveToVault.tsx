// "Save to vault" with the PIN steps inline: create one the first time, unlock after that.

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, LockKey, X } from "@phosphor-icons/react";
import { Button } from "./ui.tsx";
import { PinPad } from "./PinPad.tsx";
import { createPin, hasPin, isUnlocked, save, unlock } from "../lib/vault.ts";
import { useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

export function SaveToVault({ id }: { id: string }) {
  const t = useT();
  const s = useStore((st) => st.sessions[id]);
  const saved = useStore((st) => st.profile.checks.find((c) => c.id === id)?.saved ?? false);
  const [step, setStep] = useState<null | "create" | "confirm" | "unlock">(null);
  const [first, setFirst] = useState("");

  async function doSave() {
    if (!s) return;
    await save({ id, title: s.title, self: s.self, chat: s.chat, analysis: s.analysis });
    setStep(null);
  }

  if (saved)
    return (
      <Button tone="quiet" disabled>
        <CheckCircle size={20} weight="fill" className="text-safe" /> {t.vault.saved}
      </Button>
    );

  return (
    <>
      <Button
        tone="quiet"
        onClick={() => {
          if (!hasPin()) setStep("create");
          else if (!isUnlocked()) setStep("unlock");
          else void doSave();
        }}
      >
        <LockKey size={20} weight="bold" /> {t.vault.save}
      </Button>
      <AnimatePresence>
        {step && (
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 grid place-items-center bg-[color-mix(in_srgb,var(--bg),transparent_15%)] p-4 backdrop-blur-md"
          >
            <motion.div initial={{ y: 24 }} animate={{ y: 0 }} className="relative w-full max-w-sm rounded-card border border-line bg-surface p-6 pt-10">
              <button onClick={() => setStep(null)} className="absolute end-3 top-3 grid size-11 place-items-center rounded-full text-dim hover:bg-raised" aria-label={t.common.close}>
                <X size={20} weight="bold" />
              </button>
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
                    await createPin(p);
                    await doSave();
                  }}
                />
              )}
              {step === "unlock" && (
                <PinPad
                  title={t.vault.unlock}
                  onDone={async (p) => {
                    if (!(await unlock(p))) return false;
                    await doSave();
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
