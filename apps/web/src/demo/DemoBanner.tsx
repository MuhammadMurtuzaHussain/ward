// Says on every screen of the hosted demo what it is, and what it isn't.

import { Browser } from "@phosphor-icons/react";
import { useT } from "../i18n/index.ts";
import { DEMO } from "./demo.ts";
import { startTour } from "./Tour.tsx";

export function DemoBanner() {
  const t = useT();
  if (!DEMO) return null;
  return (
    <div role="note" className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-line [background:linear-gradient(var(--glow-soft),var(--glow-soft)),var(--bg)] px-4 py-2 pe-32 text-center text-xs font-bold text-glow sm:text-sm lg:pe-36">
      <Browser size={18} weight="bold" className="shrink-0" /> <span>{t.demo.banner}</span>
      <button onClick={startTour} className="shrink-0 rounded-full bg-glow px-3 py-1 text-glow-ink hover:brightness-105">
        {t.demo.tour.button}
      </button>
    </div>
  );
}
