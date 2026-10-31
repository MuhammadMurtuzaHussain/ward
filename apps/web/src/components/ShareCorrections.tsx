// "Help make Ward better": the child's corrections for this chat as a small file they can choose
// to send the project. The dialog shows the file itself, exactly as it will be saved. The words of
// the messages go in only if the child ticks the box; names and times never do. Nothing is sent.

import { useState } from "react";
import { motion } from "motion/react";
import { DownloadSimple, X } from "@phosphor-icons/react";
import { Button } from "./ui.tsx";
import { correctionsFile, type Correction } from "../lib/corrections.ts";
import { useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

async function saveFile(json: string) {
  const file = new File([json], "ward-corrections.json", { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Ward corrections" });
      return;
    } catch {
      // cancelled: fall through to a download
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function ShareCorrections({ items, wordLists, onClose }: { items: { correction: Correction; text: string }[]; wordLists: string[]; onClose: () => void }) {
  const t = useT();
  const lang = useStore((s) => s.profile.lang);
  const [includeText, setIncludeText] = useState(false);
  const json = JSON.stringify(correctionsFile(items, { includeText, language: lang, wordLists }), null, 2);

  return (
    <motion.div role="dialog" aria-modal aria-labelledby="share-corrections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 overflow-y-auto bg-[color-mix(in_srgb,var(--bg),transparent_10%)] p-4 backdrop-blur-md">
      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="relative mx-auto my-8 w-full max-w-xl rounded-card border border-line bg-surface p-6">
        <button onClick={onClose} className="absolute end-3 top-3 grid size-11 place-items-center rounded-full text-dim hover:bg-raised" aria-label={t.common.close}>
          <X size={20} weight="bold" />
        </button>
        <h2 id="share-corrections" className="pe-10 font-display text-2xl font-bold tracking-tight">
          {t.correct.shareTitle}
        </h2>
        <p className="mt-2 text-dim">{t.correct.shareLine}</p>

        <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3 rounded-btn bg-raised px-4 py-3">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--glow)]" checked={includeText} onChange={(e) => setIncludeText(e.target.checked)} />
          <span>
            <span className="block font-semibold">{t.correct.includeText}</span>
            <span className="text-sm text-dim">{t.correct.includeTextHint}</span>
          </span>
        </label>

        <h3 className="mt-6 text-sm font-bold text-dim">{t.correct.preview}</h3>
        <pre dir="ltr" className="mt-2 max-h-72 overflow-auto rounded-btn border border-line bg-bg p-3 text-start font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
          {json}
        </pre>

        <Button className="mt-6 w-full" onClick={() => void saveFile(json)}>
          <DownloadSimple size={20} weight="bold" /> {t.correct.save}
        </Button>
        <p className="mt-3 text-sm text-dim">{t.correct.where}</p>
      </motion.div>
    </motion.div>
  );
}
