import { useEffect, useRef, useState } from "react";
import { SpeakerHigh, Stop } from "@phosphor-icons/react";
import { speak, stopSpeaking } from "../lib/speech.ts";
import { useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

/** A small "Listen" button. Shown only when read-aloud is on for this profile. */
export function Speak({ text, className = "" }: { text: string | string[]; className?: string }) {
  const on = useStore((s) => s.profile.readAloud);
  const lang = useStore((s) => s.profile.lang);
  const t = useT();
  const [busy, setBusy] = useState(false);
  // Bumped on stop, so a multi-part read doesn't carry on to the next part.
  const run = useRef(0);
  useEffect(() => () => {
    run.current++;
    stopSpeaking();
  }, []);
  if (!on) return null;
  const parts = (Array.isArray(text) ? text : [text]).filter(Boolean);
  return (
    <button
      type="button"
      onClick={async () => {
        const id = ++run.current;
        if (busy) {
          stopSpeaking();
          setBusy(false);
          return;
        }
        setBusy(true);
        for (const p of parts) {
          if (run.current !== id) return;
          await speak(p, lang);
        }
        if (run.current === id) setBusy(false);
      }}
      aria-label={busy ? t.speak.stop : t.speak.listen}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full bg-raised px-3 text-sm font-bold text-glow hover:bg-glow-soft ${className}`}
    >
      {busy ? <Stop size={16} weight="fill" /> : <SpeakerHigh size={16} weight="fill" />}
      {busy ? t.speak.stop : t.speak.listen}
    </button>
  );
}
