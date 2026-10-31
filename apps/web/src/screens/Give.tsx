// Give Ward to a friend: for places where the Play Store is hard to use. On Android, Ward sends
// its own APK phone to phone (Bluetooth, Quick Share, any app that takes a file) with no
// internet; elsewhere, or for an app-store install that can't be sent as one file, the friend
// scans a QR code for the releases page. Plain steps for the friend, and the fingerprint to check
// it's the real Ward. Nothing here touches the network unless the link is tapped.

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ArrowSquareOut, Fingerprint, ListNumbers, QrCode, ShareNetwork } from "@phosphor-icons/react";
import { Ghost } from "../components/Ghost.tsx";
import { BackBar, Button, Card, Screen } from "../components/ui.tsx";
import { apkInfo, canGiveApk, fingerprintGroups, RELEASES_URL, shareApk, type ApkInfo } from "../lib/giveWard.ts";
import { locale, useT } from "../i18n/index.ts";

export function Give() {
  const t = useT();
  const android = canGiveApk();
  // undefined while asking Android; null where there's no APK to give (web, desktop, or an error).
  const [info, setInfo] = useState<ApkInfo | null | undefined>(android ? undefined : null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (android) void apkInfo().then(setInfo);
  }, [android]);

  const canSend = android && !!info && !info.split;
  const mb = info ? new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(Math.max(1, info.bytes / 1e6)) : "";

  async function send() {
    setBusy(true);
    setNote(null);
    try {
      const { name } = await shareApk(t.give.chooser);
      setNote({ ok: true, text: t.give.ready(name) });
    } catch (e) {
      const split = (e as { code?: string })?.code === "SPLIT";
      if (split && info) setInfo({ ...info, split: true });
      else setNote({ ok: false, text: t.give.failed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackBar title={t.give.title} />
      <div className="flex items-center gap-4">
        <Ghost mood="cheer" size={72} className="shrink-0" />
        <p className="text-lg leading-relaxed">{t.give.intro}</p>
      </div>

      <div className="mt-6 grid gap-4">
        {android && (
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <ShareNetwork size={22} weight="bold" className="text-glow" /> {t.give.send}
            </h2>
            {info === undefined && <p className="mt-2 text-dim">{t.give.preparing}</p>}
            {canSend && (
              <>
                <p className="mt-2 text-dim">{t.give.sendLine}</p>
                <Button className="mt-4 w-full sm:w-auto" onClick={send} disabled={busy}>
                  <ShareNetwork size={20} weight="bold" /> {busy ? t.give.preparing : t.give.send}
                </Button>
                <p className="mt-2 text-sm text-dim">
                  {t.give.version(info.version)} · {t.give.size(mb)}
                </p>
              </>
            )}
            {info?.split && <p className="mt-2 text-dim">{t.give.split}</p>}
            {info === null && <p className="mt-2 text-dim">{t.give.failed}</p>}
            {note && (
              <p role="status" className={`mt-3 text-sm font-bold ${note.ok ? "text-safe" : "text-alarm"}`}>
                {note.text}
              </p>
            )}
          </Card>
        )}

        {(!android || info?.split || info === null) && (
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <QrCode size={22} weight="bold" className="text-glow" /> {t.give.online}
            </h2>
            <p className="mt-2 text-dim">{t.give.onlineLine}</p>
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
              <ReleasesQr label={t.give.qrLabel} />
              <ReleasesLink label={t.give.link} />
            </div>
            {!android && <p className="mt-4 text-sm text-dim">{t.give.fromPhone}</p>}
          </Card>
        )}

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <ListNumbers size={22} weight="bold" className="text-glow" /> {t.give.friend}
          </h2>
          <p className="mt-2 text-dim">{t.give.friendLine}</p>
          <ol className="mt-3 grid list-decimal gap-2 ps-5 marker:font-bold marker:text-glow">
            {t.give.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Fingerprint size={22} weight="bold" className="text-glow" /> {t.give.real}
          </h2>
          {info?.certSha256 ? (
            <>
              <p className="mt-2 text-dim">{t.give.realLine}</p>
              <FingerprintBoxes label={t.give.fingerprint} hex={info.certSha256} />
              <p className="mt-3 text-sm text-dim">{t.give.sideBySide}</p>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-bold text-dim hover:text-ink">{t.give.fileFingerprint}</summary>
                <p dir="ltr" className="mt-2 break-all font-mono text-xs text-dim">
                  {info.apkSha256}
                </p>
              </details>
            </>
          ) : (
            <p className="mt-2 text-dim">{t.give.realWeb}</p>
          )}
          <div className="mt-4">
            <ReleasesLink label={t.give.releases} />
          </div>
        </Card>

        <p className="text-sm text-dim">{t.give.parents}</p>
      </div>
    </Screen>
  );
}

/** Opening this is the feature's only network use, and only when tapped. */
function ReleasesLink({ label }: { label: string }) {
  return (
    <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-glow">
      {label} <ArrowSquareOut size={16} weight="bold" className="flip-rtl" />
    </a>
  );
}

function ReleasesQr({ label }: { label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // Dark on white whatever the theme, with a quiet zone: what phone cameras read best.
    if (canvas.current) void QRCode.toCanvas(canvas.current, RELEASES_URL, { errorCorrectionLevel: "M", margin: 3, width: 200, color: { dark: "#000000", light: "#ffffff" } });
  }, []);
  return (
    <div className="rounded-card bg-white p-2">
      <canvas ref={canvas} width={200} height={200} className="block size-[200px]" role="img" aria-label={label} />
    </div>
  );
}

/** 16 boxes of four characters: easy to compare one by one, or read out to each other. */
function FingerprintBoxes({ label, hex }: { label: string; hex: string }) {
  return (
    <figure className="mt-4">
      <figcaption className="text-sm font-bold text-dim">{label}</figcaption>
      <div dir="ltr" className="mt-2 grid max-w-sm grid-cols-4 gap-1.5 font-mono text-[0.95rem] font-bold tracking-wider">
        {fingerprintGroups(hex).map((g, i) => (
          <span key={i} className="rounded-btn bg-raised px-2 py-1.5 text-center">
            {g}
          </span>
        ))}
      </div>
    </figure>
  );
}
