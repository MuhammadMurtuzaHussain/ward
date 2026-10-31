import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Backspace } from "@phosphor-icons/react";
import { useT } from "../i18n/index.ts";
import { useStore } from "../lib/store.ts";

/** Four big digits and a keypad that works with touch and a keyboard alike. */
export function PinPad({ title, hint, onDone }: { title: string; hint?: string; onDone: (pin: string) => Promise<boolean | void> | boolean | void }) {
  const t = useT();
  const dir = useStore((s) => s.profile.lang) === "ur" ? "rtl" : "ltr";
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const controls = useAnimationControls();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => ref.current?.focus(), []);

  async function press(d: string) {
    if (busy) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      setBusy(true);
      let ok: boolean | void;
      try {
        ok = await onDone(next);
      } catch (e) {
        setPin("");
        throw e;
      } finally {
        // Whatever onDone does, the pad never stays frozen with four dots in it.
        setBusy(false);
      }
      if (ok === false) {
        await controls.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.35 } });
        setPin("");
      }
    }
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) press(e.key);
        if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
      }}
      dir="ltr" className="mx-auto flex w-full max-w-xs flex-col items-center outline-none"
    >
      {/* The keypad is laid out left to right; the words read in the page's own direction
          ("auto" would read "Sara کا PIN" as English, from its first letter). */}
      <h2 dir={dir} className="text-center font-display text-2xl font-bold tracking-tight">{title}</h2>
      {hint && <p dir={dir} className="mt-2 text-center text-dim">{hint}</p>}
      <motion.div animate={controls} className="my-7 flex gap-4" aria-live="polite" aria-label={t.vault.pinDigits(pin.length)}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-4 rounded-full transition-colors ${i < pin.length ? "bg-glow" : "bg-raised"}`} />
        ))}
      </motion.div>
      <div className="grid w-full grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k) =>
          k === "" ? (
            <span key="blank" />
          ) : (
            <button
              key={k}
              onClick={() => (k === "del" ? setPin((p) => p.slice(0, -1)) : press(k))}
              aria-label={k === "del" ? t.vault.del1 : k}
              className="grid h-16 place-items-center rounded-btn bg-raised font-display text-2xl font-semibold active:scale-95"
            >
              {k === "del" ? <Backspace size={24} /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
