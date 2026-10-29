// "Make a report": the child chooses who it's for, what about themselves to include, and what
// they want to happen. Everything about them is optional. If they say they're in danger now,
// the helplines come first.

import { useState } from "react";
import { motion } from "motion/react";
import { FilePdf, X } from "@phosphor-icons/react";
import { buildReport, WANTS, type Want } from "@ward/engine";
import { Button } from "./ui.tsx";
import { HelpNow } from "./HelpNow.tsx";
import { exportReport } from "../lib/report.ts";
import { useStore } from "../lib/store.ts";
import type { VaultItem } from "../lib/vault.ts";

const RECIPIENTS = [
  { id: "helpline", label: "A helpline" },
  { id: "school", label: "My school" },
  { id: "adult", label: "A trusted adult" },
  { id: "police", label: "The police" },
] as const;

export function ReportDialog({ item, onClose }: { item: VaultItem; onClose: () => void }) {
  const p = useStore((s) => s.profile);
  const [recipient, setRecipient] = useState<(typeof RECIPIENTS)[number]["id"]>("helpline");
  const [firstName, setFirstName] = useState(p.name);
  const [city, setCity] = useState("");
  const [shareAge, setShareAge] = useState(true);
  const [wants, setWants] = useState<Want[]>(["stop"]);
  const [danger, setDanger] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const field = "mt-1.5 w-full rounded-btn border border-line bg-bg px-4 py-3 text-ink placeholder:text-dim/70 focus:border-glow focus:outline-none";

  return (
    <motion.div role="dialog" aria-modal aria-labelledby="report-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 overflow-y-auto bg-[color-mix(in_srgb,var(--bg),transparent_10%)] p-4 backdrop-blur-md">
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="relative mx-auto my-8 w-full max-w-xl rounded-card border border-line bg-surface p-6">
        <button onClick={onClose} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-dim hover:bg-raised" aria-label="Close">
          <X size={20} weight="bold" />
        </button>
        <h2 id="report-title" className="font-display text-2xl font-bold tracking-tight">
          Make a report
        </h2>
        <p className="mt-1 text-dim">A clear report gets taken seriously. You choose what goes in it.</p>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-dim">Who is it for?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {RECIPIENTS.map((r) => (
              <button key={r.id} onClick={() => setRecipient(r.id)} aria-pressed={recipient === r.id} className={`min-h-11 rounded-btn text-sm font-bold ${recipient === r.id ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-dim">Are you in danger right now?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              [true, "Yes"],
              [false, "No"],
            ].map(([v, l]) => (
              <button key={String(v)} onClick={() => setDanger(v as boolean)} aria-pressed={danger === v} className={`min-h-11 rounded-btn text-sm font-bold ${danger === v ? (v ? "bg-alarm text-[#1c0505]" : "bg-glow text-glow-ink") : "bg-raised text-dim hover:text-ink"}`}>
                {l as string}
              </button>
            ))}
          </div>
          {danger && (
            <div className="mt-4">
              <HelpNow />
            </div>
          )}
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-dim">What do you want to happen?</legend>
          <div className="mt-2 grid gap-2">
            {(Object.keys(WANTS) as Want[]).map((w) => (
              <label key={w} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-btn bg-raised px-4">
                <input type="checkbox" className="size-5 accent-[var(--glow)]" checked={wants.includes(w)} onChange={(e) => setWants((x) => (e.target.checked ? [...x, w] : x.filter((y) => y !== w)))} />
                {WANTS[w]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-dim">About you (all optional)</legend>
          <label htmlFor="r-name" className="mt-2 block text-sm text-dim">
            First name
          </label>
          <input id="r-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={field} />
          <label htmlFor="r-city" className="mt-3 block text-sm text-dim">
            Town or city (helps a helpline find the right office)
          </label>
          <input id="r-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lahore" className={field} />
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" className="size-5 accent-[var(--glow)]" checked={shareAge} onChange={(e) => setShareAge(e.target.checked)} />
            Include my age group
          </label>
        </fieldset>

        <Button
          className="mt-8 w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await buildReport({
              chat: item.chat,
              analysis: item.analysis,
              fingerprints: item.fingerprints,
              savedAt: new Date(item.savedAt),
              title: item.title,
              platform: item.chat.source === "whatsapp" ? "WhatsApp" : "a messaging app",
              reporter: { firstName, city, ageBand: shareAge ? p.age : undefined },
              inDangerNow: danger,
              wants,
              recipient,
            });
            await exportReport(r);
            setBusy(false);
          }}
        >
          <FilePdf size={20} weight="bold" /> {busy ? "Making it…" : "Make the report"}
        </Button>
        <p className="mt-2 text-sm text-dim">You get a page to print or share, and a file a helpline can check. Ward doesn't send it anywhere.</p>
      </motion.div>
    </motion.div>
  );
}
