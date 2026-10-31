// Says on every screen of the hosted demo what it is, and what it isn't.

import { Browser } from "@phosphor-icons/react";
import { useT } from "../i18n/index.ts";
import { DEMO } from "./demo.ts";

export function DemoBanner() {
  const t = useT();
  if (!DEMO) return null;
  return (
    <div role="note" className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-line bg-glow-soft px-4 py-2 pe-32 text-center text-xs font-bold text-glow sm:text-sm lg:pe-36">
      <Browser size={18} weight="bold" className="shrink-0" /> {t.demo.banner}
    </div>
  );
}
