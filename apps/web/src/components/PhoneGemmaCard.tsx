// Me > "Gemma on this phone": the child (or a parent) chooses to download the 2 GB model, ideally
// on Wi-Fi. Shown only on Android, and only offered when the phone has the memory for it.

import { useEffect, useState } from "react";
import { DeviceMobile, DownloadSimple, Trash, X } from "@phosphor-icons/react";
import { Button, Card, Pill } from "./ui.tsx";
import { cancelPhoneGemma, downloadPhoneGemma, phoneStatus, removePhoneGemma, type PhoneStatus } from "../lib/phoneGemma.ts";

const gb = (b: number) => `${(b / 1e9).toFixed(1)} GB`;

export function PhoneGemmaCard() {
  const [s, setS] = useState<PhoneStatus | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => phoneStatus().then(setS);
  useEffect(() => {
    void refresh();
  }, []);

  if (!s) return null;

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <DeviceMobile size={22} weight="bold" className="text-glow" /> Gemma on this phone
      </h2>
      <p className="mt-2 text-sm text-dim">
        Gemma 4 can run right on this phone to help you write: the message to someone you trust, and feedback on your lesson answers. Nothing leaves the phone. Ward Lite already reads your chats without it.
      </p>

      {!s.supported ? (
        <p className="mt-3 text-sm">
          This phone has {gb(s.ramBytes)} of memory; Gemma needs about 6 GB. Ward Lite and the word lists keep working.
        </p>
      ) : s.downloaded ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone="safe">Ready{s.backend ? ` (${s.backend})` : ""}</Pill>
          <Button
            tone="ghost"
            className="text-sm"
            onClick={async () => {
              if (!confirm("Remove Gemma from this phone? You can download it again later.")) return;
              await removePhoneGemma();
              await refresh();
            }}
          >
            <Trash size={18} /> Remove ({gb(s.modelBytes)})
          </Button>
        </div>
      ) : progress !== null ? (
        <div className="mt-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-glow transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-dim">
            <span>
              {Math.round(progress * 100)}% of {gb(s.modelBytes)}. You can keep using Ward.
            </span>
            <button onClick={() => cancelPhoneGemma()} className="flex min-h-10 items-center gap-1 font-bold text-dim hover:text-ink">
              <X size={16} /> Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button
            onClick={async () => {
              setError(null);
              setProgress(s.partialBytes / s.modelBytes);
              try {
                await downloadPhoneGemma((l, t) => setProgress(l / t));
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
              setProgress(null);
              await refresh();
            }}
          >
            <DownloadSimple size={20} weight="bold" /> {s.partialBytes ? "Finish download" : `Download (${gb(s.modelBytes)})`}
          </Button>
          <p className="mt-2 text-sm text-dim">Use Wi-Fi: it's a big download. It stops and picks up again if the connection drops. {gb(s.freeBytes)} free on this phone.</p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-alarm">
          {error}
        </p>
      )}
    </Card>
  );
}
