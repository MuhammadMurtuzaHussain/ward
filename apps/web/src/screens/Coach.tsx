// What to do now, in order: don't feed it, save it, shut the door, tell someone. Ward drafts the
// message to a trusted adult; the child copies or shares it themselves.

import { useEffect, useState, type ReactNode } from "react";
import { ChatCircleDots, Copy, HandPalm, MoonStars, PaperPlaneTilt, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import { Ghost } from "../components/Ghost.tsx";
import { HelpNow } from "../components/HelpNow.tsx";
import { SaveToVault } from "../components/SaveToVault.tsx";
import { BackBar, Button, Screen } from "../components/ui.tsx";
import { gemmaDraft, templateDraft } from "../lib/draft.ts";
import { updateProfile, useStore } from "../lib/store.ts";

const APPS = {
  WhatsApp: [
    "Open the chat and tap their name at the top.",
    "Scroll down and tap Report. WhatsApp gets the last few messages so they can see what happened. They aren't told it was you.",
    "Tap Block. For a group: tap the group name, then Exit group, or Report group.",
    "Mute a group at night: group name, then Notifications, then Mute.",
  ],
  Instagram: [
    "Press and hold a mean message or comment, then tap Report.",
    "On their profile, tap the three dots at the top right, then Block. Restrict is a quieter option: they won't know, and you won't see their comments.",
    "Reports are anonymous.",
  ],
  TikTok: [
    "Press and hold a mean comment, then tap Report.",
    "On their profile, tap the share arrow at the top right, then Report or Block.",
    "In Settings, Privacy, you can limit who comments on your videos.",
  ],
  Snapchat: [
    "Press and hold their name in your chats.",
    "Tap Manage Friendship, then Report or Block.",
    "Snaps can be screenshotted. Save evidence with screenshots of your own before you block.",
  ],
  Discord: [
    "Press and hold (or right-click) a message, then Report Message.",
    "Tap their name, then the three dots, then Block.",
    "Tell a server moderator too: they can remove people from the server.",
  ],
} as const;

export function Coach({ id }: { id: string }) {
  const s = useStore((st) => st.sessions[id]);
  const p = useStore((st) => st.profile);
  const [app, setApp] = useState<keyof typeof APPS>(s?.chat.source === "whatsapp" ? "WhatsApp" : "WhatsApp");
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
      <BackBar title="What to do" />
      <div className="flex items-center gap-4">
        <Ghost mood="calm" size={72} />
        <p className="text-lg leading-relaxed">One step at a time. You don't have to do all of this today.</p>
      </div>

      {danger && (
        <div className="mt-6">
          <HelpNow images={imageRisk} />
        </div>
      )}

      <ol className="mt-8 grid gap-8">
        <Step n={1} icon={HandPalm} title="Don't reply to them">
          Replying angry is what they're hoping for, and it can make it look like you started it. You don't owe them an answer.
          {imageRisk && <b className="mt-2 block text-alarm">If someone is asking for photos or money, stop replying and never pay. It won't stop if you do.</b>}
        </Step>

        <Step n={2} icon={ShieldCheck} title="Keep the evidence">
          Save it before you block anyone, so the proof doesn't disappear.
          <div className="mt-3">
            <SaveToVault id={id} />
          </div>
        </Step>

        <Step n={3} icon={ChatCircleDots} title="Block, report, mute">
          <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Which app">
            {(Object.keys(APPS) as (keyof typeof APPS)[]).map((k) => (
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
          <ul className="mt-4 grid list-disc gap-2 pl-5 marker:text-glow">
            {APPS[app].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Step>

        {s.analysis.patterns.some((p) => p.kind === "nightwatch") && (
          <Step n={4} icon={MoonStars} title="Close the door at night">
            Mute the chat after 9pm and charge your phone outside your room. The messages will still be there in the morning, when you're stronger and adults are awake.
          </Step>
        )}

        <Step n={s.analysis.patterns.some((p) => p.kind === "nightwatch") ? 5 : 4} icon={PaperPlaneTilt} title="Tell someone you trust">
          A parent, aunt, older cousin, teacher or counsellor. I wrote a message you can send. Change anything you like.
          <label htmlFor="adult" className="mt-4 block text-sm font-bold text-dim">
            Who are you sending it to?
          </label>
          <input
            id="adult"
            value={adult}
            onChange={(e) => setAdult(e.target.value)}
            onBlur={() => adult.trim() && !p.trusted.some((t) => t.name === adult.trim()) && updateProfile({ trusted: [{ name: adult.trim(), how: "" }, ...p.trusted].slice(0, 4) })}
            placeholder="Ammi, Mr Khan, Aunt Sara"
            className="mt-1.5 w-full rounded-btn border border-line bg-surface px-4 py-3 text-ink placeholder:text-dim/70 focus:border-glow focus:outline-none"
          />
          <label htmlFor="draft" className="mt-4 block text-sm font-bold text-dim">
            Your message
          </label>
          <textarea
            id="draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
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
              {copied ? "Copied" : typeof navigator.share === "function" ? "Share" : "Copy"}
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
              <Sparkle size={18} weight="bold" /> {drafting ? "Writing…" : "Write it another way"}
            </Button>
          </div>
          <p className="mt-2 text-sm text-dim">I never send it myself. You choose if and when.</p>
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
        <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-glow font-display text-xs font-bold text-glow-ink">{n}</span>
      </span>
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        <div className="mt-1.5 leading-relaxed text-dim [&_b]:text-ink [&_li]:text-ink">{children}</div>
      </div>
    </li>
  );
}
