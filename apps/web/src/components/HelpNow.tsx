import { useState } from "react";
import { Phone, Lifebuoy } from "@phosphor-icons/react";
import { ELSEWHERE, guessRegion, REGIONS, TAKE_IT_DOWN } from "../lib/help.ts";
import { useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

/** The crisis block. Shown at the top of any urgent result, and always reachable from Coach. */
export function HelpNow({ images = false }: { images?: boolean }) {
  const t = useT();
  const ur = useStore((s) => s.profile.lang) === "ur";
  const [region, setRegion] = useState(guessRegion().id);
  const r = REGIONS.find((x) => x.id === region)!;
  return (
    <section aria-labelledby="help-now" className="rounded-card border border-alarm/40 bg-alarm-soft p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Lifebuoy size={26} weight="bold" className="text-alarm" />
        <h2 id="help-now" className="font-display text-xl font-bold tracking-tight">
          {t.help.title}
        </h2>
      </div>
      <p className="mt-2 max-w-[52ch]">{t.help.line(r.emergency)}</p>
      <ul className="mt-4 grid gap-2">
        {r.lines.map((l) => (
          <li key={l.number}>
            <a href={`tel:${l.number.replace(/\s/g, "")}`} className="flex min-h-14 items-center gap-4 rounded-btn bg-surface px-4 py-3 hover:bg-raised">
              <Phone size={22} weight="fill" className="shrink-0 text-alarm" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold">
                  {l.name} <span className="text-alarm" dir="ltr">{l.number}</span>
                </span>
                <span className="text-sm text-dim">{ur && l.noteUr ? l.noteUr : l.note}</span>
              </span>
            </a>
          </li>
        ))}
        {images && (
          <li>
            <a href={TAKE_IT_DOWN.url} target="_blank" rel="noreferrer" className="block rounded-btn bg-surface px-4 py-3 hover:bg-raised">
              <span className="block font-display font-bold">{TAKE_IT_DOWN.name}</span>
              <span className="text-sm text-dim">{ur ? TAKE_IT_DOWN.noteUr : TAKE_IT_DOWN.note}</span>
            </a>
          </li>
        )}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <label htmlFor="region" className="text-dim">
          {t.help.where}
        </label>
        <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-btn border border-line bg-surface px-3 py-2 text-ink">
          {REGIONS.map((x) => (
            <option key={x.id} value={x.id}>
              {ur && x.nameUr ? x.nameUr : x.name}
            </option>
          ))}
        </select>
        <a href={ELSEWHERE.url} target="_blank" rel="noreferrer" className="font-bold text-glow">
          {t.help.elsewhere}
        </a>
      </div>
    </section>
  );
}
