// Me > "Gemma inside Ward": on a computer without Ollama, the child (or an adult) chooses to
// download Gemma 4 once, and Ward runs it with llama.cpp from then on, offline. Shown only in
// Ward for desktop, and only where llama.cpp loaded on this computer.

import { useEffect, useState } from "react";
import { Desktop, DownloadSimple, Trash, X } from "@phosphor-icons/react";
import { Button, Card, Pill } from "./ui.tsx";
import { useT } from "../i18n/index.ts";
import { cancelDesktopGemma, desktopStatus, downloadDesktopGemma, removeDesktopGemma, type DesktopProgress, type DesktopStatus } from "../lib/desktopGemma.ts";

const gb = (b: number) => `${(b / 1e9).toFixed(1)} GB`;

export function DesktopGemmaCard({ ollamaReady = false, onChange }: { ollamaReady?: boolean; onChange?: () => void }) {
  const t = useT();
  const [s, setS] = useState<DesktopStatus | null>(null);
  const [progress, setProgress] = useState<DesktopProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setS(await desktopStatus());
    onChange?.();
  };
  useEffect(() => {
    // A download carries on while the child is elsewhere in Ward; pick its progress back up.
    void desktopStatus().then((st) => {
      setS(st);
      if (st?.downloading) void download(st);
    });
  }, []);

  // Not Ward for desktop, or llama.cpp couldn't load here: nothing to offer.
  if (!s?.available) return null;

  const pct = progress ? Math.round((progress.loaded / progress.total) * 100) : 0;
  const enoughSpace = s.freeBytes + s.partialBytes > s.modelBytes * 1.05;

  async function download(st: DesktopStatus) {
    setError(null);
    setProgress({ loaded: st.partialBytes, total: st.modelBytes });
    try {
      await downloadDesktopGemma(setProgress);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/cancelled/.test(msg)) setError(/damaged/.test(msg) ? msg.replace(/^.*Error: /, "") : t.desk.failed);
    }
    setProgress(null);
    await refresh();
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Desktop size={22} weight="bold" className="text-glow" /> {t.desk.title}
      </h2>
      <p className="mt-2 text-sm text-dim">{t.desk.line}</p>

      {s.downloaded ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone="safe">
            {t.desk.ready}
            {s.gpu ? ` (${s.gpu})` : ""}
          </Pill>
          <Button
            tone="ghost"
            className="text-sm"
            onClick={async () => {
              if (!confirm(t.desk.removeConfirm)) return;
              await removeDesktopGemma();
              await refresh();
            }}
          >
            <Trash size={18} /> {t.desk.remove(gb(s.modelBytes))}
          </Button>
        </div>
      ) : ollamaReady ? (
        <p className="mt-3 text-sm">{t.desk.ollama}</p>
      ) : !s.supported ? (
        <p className="mt-3 text-sm">{t.desk.tooSmall(gb(s.ramBytes))}</p>
      ) : progress ? (
        <div className="mt-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-glow transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm text-dim">
            <span aria-live="polite">{progress.verifying ? t.desk.verifying : t.desk.progress(pct, gb(s.modelBytes))}</span>
            {!progress.verifying && (
              <button onClick={() => cancelDesktopGemma()} className="flex min-h-10 items-center gap-1 font-bold text-dim hover:text-ink">
                <X size={16} /> {t.desk.stop}
              </button>
            )}
          </div>
        </div>
      ) : !enoughSpace ? (
        <p className="mt-3 text-sm">{t.desk.noSpace(gb(s.freeBytes))}</p>
      ) : (
        <div className="mt-4">
          <Button onClick={() => download(s)}>
            <DownloadSimple size={20} weight="bold" /> {s.partialBytes ? t.desk.finish : t.desk.download(gb(s.modelBytes))}
          </Button>
          <p className="mt-2 text-sm text-dim">{t.desk.space(gb(s.freeBytes))}</p>
          <p className="mt-1 text-xs text-dim">{t.desk.privacy}</p>
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
