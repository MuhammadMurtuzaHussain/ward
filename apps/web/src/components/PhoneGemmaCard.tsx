// Me > "Gemma on this phone": the child (or a parent) chooses to download the 2 GB model, ideally
// on Wi-Fi. Shown only on Android, and only offered when the phone has the memory for it.

import { useEffect, useState } from "react";
import { DeviceMobile, DownloadSimple, Trash, X } from "@phosphor-icons/react";
import { Button, Card, Pill } from "./ui.tsx";
import { useT } from "../i18n/index.ts";
import { cancelPhoneGemma, downloadPhoneGemma, phoneStatus, removePhoneGemma, type PhoneStatus } from "../lib/phoneGemma.ts";

const gb = (b: number) => `${(b / 1e9).toFixed(1)} GB`;

export function PhoneGemmaCard() {
  const t = useT();
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
        <DeviceMobile size={22} weight="bold" className="text-glow" /> {t.phone.title}
      </h2>
      <p className="mt-2 text-sm text-dim">
        {t.phone.line}
      </p>

      {!s.supported ? (
        <p className="mt-3 text-sm">
          {t.phone.tooSmall(gb(s.ramBytes))}
        </p>
      ) : s.downloaded ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone="safe">
            {t.phone.ready}
            {s.backend ? ` (${s.backend})` : ""}
          </Pill>
          <Button
            tone="ghost"
            className="text-sm"
            onClick={async () => {
              if (!confirm(t.phone.removeConfirm)) return;
              await removePhoneGemma();
              await refresh();
            }}
          >
            <Trash size={18} /> {t.phone.remove(gb(s.modelBytes))}
          </Button>
        </div>
      ) : progress !== null ? (
        <div className="mt-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-glow transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-dim">
            <span>
              {t.phone.progress(Math.round(progress * 100), gb(s.modelBytes))}
            </span>
            <button onClick={() => cancelPhoneGemma()} className="flex min-h-10 items-center gap-1 font-bold text-dim hover:text-ink">
              <X size={16} /> {t.phone.stop}
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
            <DownloadSimple size={20} weight="bold" /> {s.partialBytes ? t.phone.finish : t.phone.download(gb(s.modelBytes))}
          </Button>
          <p className="mt-2 text-sm text-dim">{t.phone.wifi(gb(s.freeBytes))}</p>
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
