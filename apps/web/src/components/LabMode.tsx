// Lab mode, for shared computers in a school lab (Ward for desktop only): Ward keeps nothing
// between sessions. The desktop app wipes the page's storage when Ward opens and when it closes
// (desktop/main.mjs); here are the switch in Me and the banner that says so on every screen.

import { useEffect, useState } from "react";
import { Broom } from "@phosphor-icons/react";
import { Card } from "./ui.tsx";
import { useT } from "../i18n/index.ts";
import { labStatus, setLab } from "../lib/desktopGemma.ts";

type Lab = { on: boolean; flag: boolean };
const listeners = new Set<(l: Lab) => void>();

function useLab() {
  const [lab, setState] = useState<Lab | null>(null);
  useEffect(() => {
    void labStatus().then(setState);
    listeners.add(setState);
    return () => void listeners.delete(setState);
  }, []);
  return lab;
}

export function LabBanner() {
  const t = useT();
  const lab = useLab();
  if (!lab?.on) return null;
  return (
    <div role="status" className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-line bg-glow-soft px-4 py-2 pe-28 text-center text-sm font-bold text-glow lg:pe-4">
      <Broom size={18} weight="bold" className="shrink-0" /> {t.lab.banner}
    </div>
  );
}

export function LabCard() {
  const t = useT();
  const lab = useLab();
  if (!lab) return null;
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Broom size={22} weight="bold" className="text-glow" /> {t.lab.title}
      </h2>
      <p className="mt-2 text-sm text-dim">{t.lab.line}</p>
      {lab.flag ? (
        <p className="mt-3 text-sm font-semibold">{t.lab.flag}</p>
      ) : (
        <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="size-5 accent-[var(--glow)]"
            checked={lab.on}
            onChange={async (e) => {
              const on = e.target.checked;
              if (on && !confirm(t.lab.confirmOn)) return;
              const next = await setLab(on);
              if (next) listeners.forEach((l) => l(next));
            }}
          />
          {t.lab.toggle}
        </label>
      )}
    </Card>
  );
}
