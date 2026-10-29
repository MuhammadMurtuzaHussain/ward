// What to do now, in order: don't feed it, save it, shut the door, tell someone. Ward drafts the
// message to a trusted adult; the child copies or shares it themselves.

import { useEffect, useState, type ReactNode } from "react";
import { ChatCircleDots, Copy, HandPalm, MoonStars, PaperPlaneTilt, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import { Ghost } from "../components/Ghost.tsx";
import { HelpNow } from "../components/HelpNow.tsx";
import { SaveToVault } from "../components/SaveToVault.tsx";
import { BackBar, Button, Screen } from "../components/ui.tsx";
import { gemmaDraft, templateDraft } from "../lib/draft.ts";
import { go, updateProfile, useStore } from "../lib/store.ts";
import { Speak } from "../components/Speak.tsx";
import { useT } from "../i18n/index.ts";

const APP_NAMES = ["WhatsApp", "Instagram", "TikTok", "Snapchat", "Discord"] as const;

export function Coach({ id }: { id: string }) {
  const s = useStore((st) => st.sessions[id]);
  const p = useStore((st) => st.profile);
  const t = useT();
  const [app, setApp] = useState<(typeof APP_NAMES)[number]>("WhatsApp");
  const [adult, setAdult] = useState(p.trusted[0]?.name ?? "");
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (s) setDraft(templateDraft(s.analysis, s.title, adult));
    // Only on open; regenerating is a button so the child's edits aren't lost.
  }, [id]);

  if (!s) return <Screen><BackBar /></Screen>;
  const danger = s.analysis.level === "urgent";
  const imageRisk = s.analysis.findings.some((f) => f.severity >= 3 && (f.categories.includes("sexual") || f.categories.includes("exposure")));

  return (
    <Screen>
      <BackBar title={t.coach.title} />
      <div className="flex items-center gap-4">
        <Ghost mood="calm" size={72} />
        <p className="text-lg leading-relaxed">{t.coach.intro}</p>
      </div>

      {danger && (
        <div className="mt-6">
          <HelpNow images={imageRisk} />
        </div>
      )}

      <ol className="mt-8 grid gap-8">
        <Step n={1} icon={HandPalm} title={t.coach.dontReply}>
          {t.coach.dontReplyLine}
          {imageRisk && <b className="mt-2 block text-alarm">{t.coach.neverPay}</b>}
          <Speak text={[t.coach.dontReply, t.coach.dontReplyLine, ...(imageRisk ? [t.coach.neverPay] : [])]} className="mt-3" />
        </Step>

        <Step n={2} icon={ShieldCheck} title={t.coach.keep}>
          {t.coach.keepLine}
          <div className="mt-3">
            <SaveToVault id={id} />
          </div>
        </Step>

        <Step n={3} icon={ChatCircleDots} title={t.coach.block}>
          <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label={t.coach.whichApp}>
            {APP_NAMES.map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={app === k}
                onClick={() => setApp(k)}
                className={`min-h-10 rounded-full px-4 text-sm font-bold ${app === k ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}
              >
                {k}
              </button>
            ))}
          </div>
          <ul className="mt-4 grid list-disc gap-2 ps-5 marker:text-glow">
            {t.coach.apps[app]!.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Step>

        {s.analysis.patterns.some((p) => p.kind === "nightwatch") && (
          <Step n={4} icon={MoonStars} title={t.coach.night}>
            {t.coach.nightLine}
          </Step>
        )}

        <Step n={s.analysis.patterns.some((p) => p.kind === "nightwatch") ? 5 : 4} icon={PaperPlaneTilt} title={t.coach.tell}>
          {t.coach.tellLine}
          <label htmlFor="adult" className="mt-4 block text-sm font-bold text-dim">
            {t.coach.toWho}
          </label>
          <input
            id="adult"
            value={adult}
            onChange={(e) => setAdult(e.target.value)}
            onBlur={() => adult.trim() && !p.trusted.some((t) => t.name === adult.trim()) && updateProfile({ trusted: [{ name: adult.trim(), how: "" }, ...p.trusted].slice(0, 4) })}
            placeholder={t.coach.toWhoPlaceholder}
            className="mt-1.5 w-full rounded-btn border border-line bg-surface px-4 py-3 text-ink placeholder:text-dim/70 focus:border-glow focus:outline-none"
          />
          <label htmlFor="draft" className="mt-4 block text-sm font-bold text-dim">
            {t.coach.yourMessage}
          </label>
          <textarea
            id="draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            dir="auto"
            className="mt-1.5 w-full resize-y rounded-card border border-line bg-surface p-4 leading-relaxed text-ink focus:border-glow focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({ text: draft });
                    return;
                  } catch {
                    // cancelled, or not allowed here: fall back to copy
                  }
                }
                await navigator.clipboard.writeText(draft);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {typeof navigator.share === "function" ? <PaperPlaneTilt size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
              {copied ? t.coach.copied : typeof navigator.share === "function" ? t.coach.share : t.coach.copy}
            </Button>
            <Button
              tone="quiet"
              disabled={drafting}
              onClick={async () => {
                setDrafting(true);
                const d = (await gemmaDraft(s.analysis, s.title, adult, p.age)) ?? templateDraft(s.analysis, s.title, adult);
                setDraft(d);
                setDrafting(false);
              }}
            >
              <Sparkle size={18} weight="bold" /> {drafting ? t.coach.writing : t.coach.another}
            </Button>
          </div>
          <p className="mt-2 text-sm text-dim">{t.coach.neverSend}</p>
          <button onClick={() => go({ name: "adults" })} className="mt-4 flex min-h-11 items-center gap-2 font-bold text-glow">
            {t.coach.showGuide} <span className="flip-rtl inline-block">→</span>
          </button>
        </Step>
      </ol>

      {!danger && (
        <div className="mt-12">
          <HelpNow />
        </div>
      )}
    </Screen>
  );
}

function Step({ n, icon: I, title, children }: { n: number; icon: typeof HandPalm; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2.75rem_1fr] gap-4">
      <span className="relative grid size-11 place-items-center rounded-full bg-glow-soft text-glow" aria-hidden>
        <I size={22} weight="bold" />
        <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-glow font-display text-xs font-bold text-glow-ink">{n}</span>
      </span>
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        <div className="mt-1.5 leading-relaxed text-dim [&_b]:text-ink [&_li]:text-ink">{children}</div>
      </div>
    </li>
  );
}
