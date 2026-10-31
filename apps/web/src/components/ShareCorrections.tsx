// "Keep my corrections": the child's corrections for this chat as a small file they can keep,
// and give to their teacher if their school joins a Ward pilot. The dialog shows the file itself,
// exactly as it will be saved. Children never get the words of the messages in it: the "include
// the words" box is only for a future counsellor flow (`allowText`), and nothing passes it yet.
// Names and times never go in. Nothing is sent.

import { useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "./ui.tsx";
import { Dialog } from "./Dialog.tsx";
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

export function ShareCorrections({
  items,
  wordLists,
  onClose,
  allowText = false,
}: {
  items: { correction: Correction; text: string }[];
  wordLists: string[];
  onClose: () => void;
  /** Counsellor flow only (not built yet). Children never see the "include the words" box. */
  allowText?: boolean;
}) {
  const t = useT();
  const lang = useStore((s) => s.profile.lang);
  const [ticked, setIncludeText] = useState(false);
  const includeText = allowText && ticked;
  const json = JSON.stringify(correctionsFile(items, { includeText, language: lang, wordLists }), null, 2);

  return (
    <Dialog onClose={onClose} labelledBy="share-corrections" size="lg">
      <h2 id="share-corrections" className="pe-10 font-display text-2xl font-bold tracking-tight">
        {t.correct.shareTitle}
      </h2>
      <p className="mt-2 text-dim">{t.correct.shareLine}</p>

      {allowText && (
        <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3 rounded-btn bg-raised px-4 py-3">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--glow)]" checked={includeText} onChange={(e) => setIncludeText(e.target.checked)} />
          <span>
            <span className="block font-semibold">{t.correct.includeText}</span>
            <span className="text-sm text-dim">{t.correct.includeTextHint}</span>
          </span>
        </label>
      )}

      <h3 className="mt-6 text-sm font-bold text-dim">{t.correct.preview}</h3>
      <pre dir="ltr" className="mt-2 max-h-72 overflow-auto rounded-btn border border-line bg-bg p-3 text-start font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
        {json}
      </pre>

      <Button className="mt-6 w-full" onClick={() => void saveFile(json)}>
        <DownloadSimple size={20} weight="bold" /> {t.correct.save}
      </Button>
      <p className="mt-3 text-sm text-dim">{t.correct.where}</p>
    </Dialog>
  );
}
