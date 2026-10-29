// The counsellor's side of a QR hand-over: the camera reads the child's loop of codes, frame by
// frame, until the whole report is in. Decoding happens here (jsQR); no image leaves the device.

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "./ui.tsx";
import { FrameCollector } from "../lib/qrTransfer.ts";
import { useT } from "../i18n/index.ts";

export function QrScan({ onText, onCancel }: { onText: (text: string) => void; onCancel: () => void }) {
  const t = useT();
  const video = useRef<HTMLVideoElement>(null);
  const [got, setGot] = useState<[number, number] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const collector = new FrameCollector();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    let last = 0;

    const tick = async (now: number) => {
      if (stopped) return;
      const v = video.current;
      // About ten reads a second is plenty for a loop that changes every 350 ms.
      if (v && v.readyState >= 2 && now - last > 90) {
        last = now;
        const scale = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
        if (code && collector.accept(code.data)) {
          setGot([collector.parts.size, collector.count]);
          if (collector.done) {
            stopped = true;
            stream?.getTracks().forEach((tr) => tr.stop());
            onText(await collector.text());
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((tr) => tr.stop());
        stream = s;
        video.current!.srcObject = s;
        void video.current!.play();
        raf = requestAnimationFrame(tick);
      })
      .catch(() => setFailed(true)) ?? setFailed(true);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <h3 className="font-display text-xl font-bold">{t.counsel.scanTitle}</h3>
      <p className="mt-1 max-w-[44ch] text-sm text-dim">{failed ? t.counsel.noCamera : t.counsel.scanLine}</p>
      {!failed && (
        <div className="relative mt-4 w-full max-w-sm overflow-hidden rounded-card bg-black">
          <video ref={video} playsInline muted className="aspect-square w-full object-cover" />
          <div className="pointer-events-none absolute inset-6 rounded-[18px] border-4 border-white/70" aria-hidden />
        </div>
      )}
      {!failed && (
        <div className="mt-3 w-full max-w-sm" role="status">
          <div className="h-2 overflow-hidden rounded-full bg-raised">
            <div className="h-full bg-glow transition-[width]" style={{ width: got ? `${(got[0] / got[1]) * 100}%` : "0%" }} />
          </div>
          <p className="mt-1.5 text-sm font-bold tabular-nums text-dim">{got ? t.counsel.scanGot(got[0], got[1]) : t.counsel.scanWaiting}</p>
        </div>
      )}
      <Button tone="quiet" className="mt-4" onClick={onCancel}>
        {t.counsel.cancel}
      </Button>
    </div>
  );
}
