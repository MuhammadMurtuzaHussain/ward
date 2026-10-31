import { Phone, Lifebuoy, Globe } from "@phosphor-icons/react";
import { chooseRegion, ELSEWHERE, OTHER, regionById, REGIONS, TAKE_IT_DOWN } from "../lib/help.ts";
import { updateProfile, useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

/** The crisis block. Shown at the top of any urgent result, and always reachable from Coach. */
export function HelpNow({ images = false }: { images?: boolean }) {
  const t = useT();
  const ur = useStore((s) => s.profile.lang) === "ur";
  // The child's own pick is saved in their profile and wins over the time-zone guess next time.
  const region = chooseRegion(useStore((s) => s.profile.region));
  const r = regionById(region);
  return (
    <section aria-labelledby="help-now" className="rounded-card border border-alarm/40 bg-alarm-soft p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Lifebuoy size={26} weight="bold" className="text-alarm" />
        <h2 id="help-now" className="font-display text-xl font-bold tracking-tight">
          {t.help.title}
        </h2>
      </div>
      <p className="mt-2 max-w-[52ch]">{!r ? t.help.lineOther : r.emergency ? t.help.line(r.emergency, r.free !== false) : t.help.lineLocal}</p>
      <ul className="mt-4 grid gap-2">
        {!r && (
          <li>
            <a href={ELSEWHERE.url} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-4 rounded-btn bg-surface px-4 py-3 hover:bg-raised">
              <Globe size={22} weight="fill" className="shrink-0 text-alarm" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold">{t.help.find}</span>
                <span className="text-sm text-dim">
                  <span dir="ltr">{ELSEWHERE.url.replace("https://", "")}</span> · {t.help.findNote}
                </span>
              </span>
            </a>
          </li>
        )}
        {r?.lines.map((l) => (
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
        <RegionSelect id="region" value={region} onChange={(id) => updateProfile({ region: id })} />
        {r && (
          <a href={ELSEWHERE.url} target="_blank" rel="noreferrer" className="font-bold text-glow">
            {t.help.otherCountries}
          </a>
        )}
      </div>
    </section>
  );
}

/** Every country Ward has helplines for, then "Somewhere else". Also used by the school kit. */
export function RegionSelect({ id, value, onChange }: { id: string; value: string; onChange: (id: string) => void }) {
  const t = useT();
  const ur = useStore((s) => s.profile.lang) === "ur";
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-btn border border-line bg-surface px-3 py-2 text-ink">
      {REGIONS.map((x) => (
        <option key={x.id} value={x.id}>
          {ur && x.nameUr ? x.nameUr : x.name}
        </option>
      ))}
      <option value={OTHER}>{t.help.elsewhere}</option>
    </select>
  );
}
