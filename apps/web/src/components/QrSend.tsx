// The child's side of a QR hand-over: the report as a loop of codes, big and high-contrast so
// another phone's camera can read them off this screen.

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Pause, Play } from "@phosphor-icons/react";
import { encodeFrames } from "../lib/qrTransfer.ts";
import { Button } from "./ui.tsx";
import { useT } from "../i18n/index.ts";

export function QrSend({ json }: { json: string }) {
  const t = useT();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    encodeFrames(json).then(setFrames);
  }, [json]);

  useEffect(() => {
    if (!frames.length || !canvas.current) return;
    // Dark on white whatever the theme, with a quiet zone: what scanners read best.
    void QRCode.toCanvas(canvas.current, frames[i]!, { errorCorrectionLevel: "M", margin: 3, width: 320, color: { dark: "#000000", light: "#ffffff" } });
  }, [frames, i]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % frames.length), 350);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  return (
    <div className="flex flex-col items-center text-center">
      <h3 className="font-display text-xl font-bold">{t.counsel.qrTitle}</h3>
      <p className="mt-1 max-w-[42ch] text-sm text-dim">{t.counsel.qrLine}</p>
      <div className="mt-4 rounded-card bg-white p-2">
        <canvas ref={canvas} width={320} height={320} className="block size-[min(320px,78vw)]" aria-label={frames.length ? t.counsel.qrPart(i + 1, frames.length) : ""} />
      </div>
      {frames.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-bold tabular-nums text-dim">{t.counsel.qrPart(i + 1, frames.length)}</span>
          {frames.length > 1 && (
            <Button tone="quiet" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />} {playing ? t.counsel.pause : t.counsel.play}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
