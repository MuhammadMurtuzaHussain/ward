// What to do now, in order: don't feed it, save it, shut the door, tell someone. Ward drafts the
// message to a trusted adult; the child copies or shares it themselves.

import { useEffect, useState, type ReactNode } from "react";
import { ChatCircleDots, ChatsCircle, Copy, Flag, HandHeart, HandPalm, MoonStars, PaperPlaneTilt, ShieldCheck, Sparkle, UsersThree } from "@phosphor-icons/react";
import { LessonSuggestions } from "../components/LessonSuggestions.tsx";
import { Ghost } from "../components/Ghost.tsx";
import { HelpNow } from "../components/HelpNow.tsx";
import { SaveToVault } from "../components/SaveToVault.tsx";
import { BackBar, Button, Screen } from "../components/ui.tsx";
import { gemmaDraft, templateDraft } from "../lib/draft.ts";
import { go, updateProfile, useStore } from "../lib/store.ts";
import { Speak } from "../components/Speak.tsx";
import { useT } from "../i18n/index.ts";
import type { Session } from "../lib/store.ts";

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
  if (!s.self) return <FriendCoach id={id} s={s} />;
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
          <AppSteps app={app} setApp={setApp} />
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

      <div className="mt-12">
        <LessonSuggestions analysis={s.analysis} self={s.self} />
      </div>

      {!danger && (
        <div className="mt-12">
          <HelpNow />
        </div>
      )}
    </Screen>
  );
}

type AppName = (typeof APP_NAMES)[number];

function AppSteps({ app, setApp }: { app: AppName; setApp: (a: AppName) => void }) {
  const t = useT();
  return (
    <>
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
    </>
  );
}

/** A line the child can copy with one tap. */
function CopyLine({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <li className="flex items-start gap-3 rounded-btn bg-raised px-4 py-3">
      <p dir="auto" className="min-w-0 flex-1 text-ink">{text}</p>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-glow hover:bg-glow-soft"
      >
        <Copy size={16} weight="bold" /> {copied ? t.friend.copied : t.friend.copy}
      </button>
    </li>
  );
}

/** "Checking for a friend": the upstander version of the coach. */
function FriendCoach({ id, s }: { id: string; s: Session }) {
  const t = useT();
  const [app, setApp] = useState<AppName>("WhatsApp");
  const danger = s.analysis.level === "urgent";
  const imageRisk = s.analysis.findings.some((f) => f.severity >= 3 && (f.categories.includes("sexual") || f.categories.includes("exposure")));
  const pileon = s.analysis.patterns.some((p) => p.kind === "pileon");

  return (
    <Screen>
      <BackBar title={t.friend.title} />
      <div className="flex items-center gap-4">
        <Ghost mood="calm" size={72} />
        <p className="text-lg leading-relaxed">{t.friend.intro}</p>
      </div>

      {danger && (
        <div className="mt-6">
          <HelpNow images={imageRisk} />
        </div>
      )}

      <ol className="mt-8 grid gap-8">
        <Step n={1} icon={HandHeart} title={t.friend.reach}>
          {t.friend.reachLine}
          <ul className="mt-3 grid gap-2">
            {t.friend.ideas.map((line) => (
              <CopyLine key={line} text={line} />
            ))}
          </ul>
        </Step>

        <Step n={2} icon={pileon ? UsersThree : HandPalm} title={t.friend.dontJoin}>
          {t.friend.dontJoinLine}
          <ul className="mt-3 grid gap-2">
            <CopyLine text={t.friend.groupLine} />
          </ul>
        </Step>

        <Step n={3} icon={ShieldCheck} title={t.friend.keep}>
          {t.friend.keepLine}
          <div className="mt-3">
            <SaveToVault id={id} />
          </div>
        </Step>

        <Step n={4} icon={Flag} title={t.friend.report}>
          {t.friend.reportLine}
          <AppSteps app={app} setApp={setApp} />
        </Step>

        <Step n={5} icon={ChatsCircle} title={t.friend.adult}>
          {t.friend.adultLine}
          {(danger || imageRisk) && <b className="mt-2 block text-alarm">{t.friend.adultDanger}</b>}
          <p className="mt-4 text-sm font-bold text-dim">{t.friend.adultDraftTitle}</p>
          <ul className="mt-1.5 grid gap-2">
            <CopyLine text={t.friend.adultDraft(s.title)} />
          </ul>
          <button onClick={() => go({ name: "adults" })} className="mt-4 flex min-h-11 items-center gap-2 font-bold text-glow">
            {t.coach.showGuide} <span className="flip-rtl inline-block">→</span>
          </button>
        </Step>
      </ol>

      <div className="mt-12">
        <LessonSuggestions analysis={s.analysis} self={null} />
      </div>

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
