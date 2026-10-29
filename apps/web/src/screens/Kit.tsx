// The school kit: run Ward for a term and measure it, with nothing but a printer. Term plan,
// lesson plans built from the lessons themselves, a letter home and an anonymous survey (in
// English, Urdu or both), and a results page where the teacher types in totals.

import { Fragment, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle, DownloadSimple, Plus, Printer, Trash, TrendDown, TrendUp } from "@phosphor-icons/react";
import { unitsFor } from "@ward/lessons";
import { BackBar, Button, Screen } from "../components/ui.tsx";
import { UnitIcon } from "../components/UnitIcon.tsx";
import { AGES } from "../lib/looks.ts";
import { guessRegion } from "../lib/help.ts";
import { KIT, type Kit as KitText } from "../lib/kit.ts";
import { emptyTally, loadClasses, saveClasses, score, SMALL, totalsCsv, type KitClass, type Tally } from "../lib/kitResults.ts";
import { printPart } from "../lib/printPart.ts";
import { uid, useStore, type AgeBand, type Lang } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

type Tab = "term" | "plans" | "letter" | "survey" | "results";
type PrintLang = Lang | "both";

export function Kit() {
  const lang = useStore((s) => s.profile.lang);
  const k = KIT[lang];
  const [tab, setTab] = useState<Tab>("term");
  return (
    <Screen wide>
      <BackBar title={k.title} />
      <p className="max-w-[70ch] text-dim">{k.intro}</p>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {(Object.keys(k.tabs) as Tab[]).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 rounded-full px-4 text-sm font-bold ${tab === id ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}
          >
            {k.tabs[id]}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "term" && <TermPlan k={k} />}
        {tab === "plans" && <LessonPlans k={k} />}
        {tab === "letter" && <Letter k={k} />}
        {tab === "survey" && <Survey k={k} />}
        {tab === "results" && <Results k={k} />}
      </div>
    </Screen>
  );
}

/** A printable sheet with its own Print button. */
function Printable({ title, lang, toolbar, children }: { title: string; lang: string; toolbar?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const k = KIT[useStore((s) => s.profile.lang)];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {toolbar}
        <Button className="ms-auto" onClick={() => ref.current && printPart(ref.current, { lang, title })}>
          <Printer size={18} weight="bold" /> {k.print}
        </Button>
      </div>
      <div ref={ref} className="rounded-card border border-line bg-surface p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}

function LangPick({ k, value, onChange }: { k: KitText; value: PrintLang; onChange: (v: PrintLang) => void }) {
  const opts: [PrintLang, string][] = [
    ["en", "English"],
    ["ur", "اردو"],
    ["both", k.both],
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-dim">{k.printLang}</span>
      {opts.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} aria-pressed={value === id} className={`min-h-10 rounded-full px-4 text-sm font-bold ${value === id ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

const langsFor = (p: PrintLang): Lang[] => (p === "both" ? ["en", "ur"] : [p]);

function AgePick({ age, setAge }: { age: AgeBand; setAge: (a: AgeBand) => void }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-dim">{t.teach.classAge}</span>
      {AGES.map((a) => (
        <button key={a.id} onClick={() => setAge(a.id)} aria-pressed={age === a.id} className={`min-h-10 rounded-full px-4 text-sm font-bold ${age === a.id ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}>
          {t.ages[a.id]![0]}
        </button>
      ))}
    </div>
  );
}

function TermPlan({ k }: { k: KitText }) {
  const lang = useStore((s) => s.profile.lang);
  const [age, setAge] = useState<AgeBand>("11");
  const units = unitsFor(age, lang);
  const rows: [string, string, string][] = [
    [k.term.week(0), k.term.start[0], k.term.start[1]],
    ...units.map((u, i): [string, string, string] => [k.term.week(i + 1), k.term.unit(u.title, u.lessons.length), u.lessons.map((l) => l.title).join(" · ")]),
    [k.term.week(units.length + 1), k.term.end[0], k.term.end[1]],
  ];
  return (
    <Printable title={k.term.title} lang={lang} toolbar={<AgePick age={age} setAge={setAge} />}>
      <h2 className="font-display text-2xl font-bold tracking-tight">{k.term.title}</h2>
      <p className="mt-1 text-dim">{k.term.line}</p>
      <ol className="mt-6 grid gap-0">
        {rows.map(([week, what, detail]) => (
          <li key={week} className="grid grid-cols-[6rem_1fr] gap-4 border-t border-line py-3">
            <span className="font-display font-bold text-glow">{week}</span>
            <span>
              <span className="block font-semibold">{what}</span>
              <span className="text-sm text-dim">{detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="no-print mt-4 text-sm text-dim">{k.term.log}</p>
    </Printable>
  );
}

function LessonPlans({ k }: { k: KitText }) {
  const t = useT();
  const lang = useStore((s) => s.profile.lang);
  const [age, setAge] = useState<AgeBand>("11");
  const units = unitsFor(age, lang);
  const region = guessRegion();
  return (
    <Printable title={k.tabs.plans} lang={lang} toolbar={<AgePick age={age} setAge={setAge} />}>
      {units.map((u, i) => (
        <article key={u.id} className={i ? "page-break mt-10 border-t border-line pt-10" : ""}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-glow-soft text-glow">
              <UnitIcon icon={u.icon} size={20} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">{k.plans.title(u.title)}</h2>
              <p className="text-sm text-dim">
                {k.plans.forAge} {t.ages[age]![0]} · {k.plans.time}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-4">
            <PlanPart title={k.plans.aim}>{u.about}</PlanPart>
            <PlanPart title={k.plans.before[0]}>{k.plans.before[1]}</PlanPart>
            <PlanPart title={k.plans.warmTitle}>{k.plans.warm[u.id] ?? ""}</PlanPart>
            <PlanPart title={k.plans.lessonsTitle}>
              <ul className="list-disc ps-5">
                {u.lessons.map((l) => (
                  <li key={l.id}>{k.plans.lessonLine(l.title, l.exercises.length)}</li>
                ))}
              </ul>
              <p className="mt-1 text-dim">{k.plans.lessonHow}</p>
            </PlanPart>
            <PlanPart title={k.plans.talkTitle}>
              <ul className="list-disc ps-5">
                {(k.plans.talk[u.id] ?? []).map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </PlanPart>
            <PlanPart title={k.plans.closeTitle}>
              {k.plans.close}{" "}
              <b>
                {region.lines.map((l) => `${l.name} ${l.number}`).join(" · ")}
              </b>
            </PlanPart>
            <PlanPart title={k.plans.tellTitle}>
              <ol className="list-decimal ps-5">
                {k.plans.tell.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </PlanPart>
          </dl>
        </article>
      ))}
    </Printable>
  );
}

function PlanPart({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-display font-bold">{title}</dt>
      <dd className="mt-1 leading-relaxed">{children}</dd>
    </div>
  );
}

function Letter({ k }: { k: KitText }) {
  const [printLang, setPrintLang] = useState<PrintLang>("both");
  const [f, setF] = useState({ school: "", teacher: "", className: "", contact: "" });
  const fields: [keyof typeof f, string][] = [
    ["school", k.letter.school],
    ["teacher", k.letter.teacher],
    ["className", k.letter.className],
    ["contact", k.letter.contact],
  ];
  return (
    <div className="grid gap-6">
      <section className="rounded-card border border-line bg-surface p-5">
        <p className="text-sm text-dim">{k.letter.fill}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <label key={key} className="grid gap-1 text-sm font-bold text-dim">
              {label}
              <input
                value={f[key]}
                dir="auto"
                onChange={(e) => setF({ ...f, [key]: e.target.value.slice(0, 80) })}
                className="rounded-btn border border-line bg-bg px-4 py-2.5 font-normal text-ink focus:border-glow focus:outline-none"
              />
            </label>
          ))}
        </div>
      </section>
      <Printable title={k.letter.title} lang={printLang === "ur" ? "ur" : "en"} toolbar={<LangPick k={k} value={printLang} onChange={setPrintLang} />}>
        {langsFor(printLang).map((l, i) => {
          const L = KIT[l].letter;
          const b = (s: string) => s.trim() || L.blank;
          return (
            <article key={l} lang={l} dir={l === "ur" ? "rtl" : "ltr"} className={i ? "page-break mt-10 border-t border-line pt-10" : ""}>
              <p className="font-display text-lg font-bold">{b(f.school)}</p>
              <p className="mt-6">{L.dear}</p>
              {L.body(b(f.className), b(f.school)).map((para) => (
                <p key={para} className="mt-3 leading-relaxed">
                  {para}
                </p>
              ))}
              <p className="mt-3 leading-relaxed">{L.contactLine(b(f.contact))}</p>
              <p className="mt-6">{L.thanks}</p>
              <p className="mt-1 font-semibold">{b(f.teacher)}</p>
            </article>
          );
        })}
      </Printable>
    </div>
  );
}

const Circle = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    <span className="inline-block size-4 rounded-full border-2 border-ink" aria-hidden />
    {children}
  </span>
);

function Survey({ k }: { k: KitText }) {
  const t = useT();
  const [printLang, setPrintLang] = useState<PrintLang>(useStore((s) => s.profile.lang));
  return (
    <div className="grid gap-4">
      <p className="max-w-[70ch] text-dim">{k.survey.teacherNote}</p>
      <Printable title={k.survey.title} lang={printLang === "ur" ? "ur" : "en"} toolbar={<LangPick k={k} value={printLang} onChange={setPrintLang} />}>
        {langsFor(printLang).map((l, i) => {
          const S = KIT[l].survey;
          const options = (opts: string[]) => (
            <span className="flex flex-wrap gap-x-5 gap-y-1">
              {opts.map((o) => (
                <Circle key={o}>{o}</Circle>
              ))}
            </span>
          );
          return (
            <article key={l} lang={l} dir={l === "ur" ? "rtl" : "ltr"} className={i ? "page-break mt-10 border-t border-line pt-10" : ""}>
              <h2 className="font-display text-2xl font-bold tracking-tight">{S.sheetTitle}</h2>
              <p className="mt-2 leading-relaxed">{S.sheetIntro}</p>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-semibold">
                <span className="flex flex-wrap items-center gap-3">
                  {S.round} <Circle>{S.before}</Circle> <Circle>{S.after}</Circle>
                </span>
                <span className="flex flex-wrap items-center gap-3">
                  {S.age}
                  {AGES.map((a) => (
                    <Circle key={a.id}>
                      <span dir="ltr">{a.id === "8" ? "8–10" : a.id === "11" ? "11–13" : "14–17"}</span>
                    </Circle>
                  ))}
                </span>
              </div>
              <SurveyPart title={S.partA}>
                {S.a.map((q, n) => (
                  <SurveyRow key={q} n={n + 1} q={q}>
                    {options(S.yesNo)}
                  </SurveyRow>
                ))}
                <SurveyRow n={S.a.length + 1} q={S.tell}>
                  {options(S.tellOptions)}
                </SurveyRow>
              </SurveyPart>
              <SurveyPart title={S.partB}>
                {S.b.map((q, n) => (
                  <SurveyRow key={q} n={S.a.length + 2 + n} q={q}>
                    {options(S.agree)}
                  </SurveyRow>
                ))}
              </SurveyPart>
              <SurveyPart title={S.partC}>
                <SurveyRow n={S.a.length + S.b.length + 2} q={S.usedWard}>
                  {options(S.yesNo.slice(0, 2))}
                </SurveyRow>
                <SurveyRow n={S.a.length + S.b.length + 3} q={S.parts}>
                  <span className="flex flex-wrap gap-x-5 gap-y-1">
                    {S.partsList.map((o) => (
                      <span key={o} className="inline-flex items-center gap-1.5">
                        <span className="inline-block size-4 rounded-[3px] border-2 border-ink" aria-hidden />
                        {o}
                      </span>
                    ))}
                  </span>
                </SurveyRow>
              </SurveyPart>
              <p className="mt-6 font-display font-bold">{S.thanks}</p>
              <p className="no-print mt-2 text-xs text-dim">{t.nav.runsHere}</p>
            </article>
          );
        })}
      </Printable>
    </div>
  );
}

function SurveyPart({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <ol className="mt-2">{children}</ol>
    </section>
  );
}

function SurveyRow({ n, q, children }: { n: number; q: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.75rem_1fr] gap-2 border-t border-line py-3" style={{ breakInside: "avoid" }}>
      <span className="font-bold text-dim">{n}.</span>
      <div>
        <p className="font-semibold">{q}</p>
        <div className="mt-2">{children}</div>
      </div>
    </li>
  );
}

function Results({ k }: { k: KitText }) {
  const lang = useStore((s) => s.profile.lang);
  const [classes, setClasses] = useState<KitClass[]>(loadClasses);
  const [active, setActive] = useState<string | null>(classes[0]?.id ?? null);
  const [name, setName] = useState("");
  const c = classes.find((x) => x.id === active) ?? null;
  const update = (next: KitClass[]) => {
    setClasses(next);
    saveClasses(next);
  };
  const patch = (fn: (c: KitClass) => KitClass) => c && update(classes.map((x) => (x.id === c.id ? fn(x) : x)));

  return (
    <div className="grid gap-6">
      <p className="max-w-[70ch] text-dim">{k.results.line}</p>
      <div className="flex flex-wrap items-center gap-2">
        {classes.map((x) => (
          <button key={x.id} onClick={() => setActive(x.id)} aria-pressed={x.id === active} className={`min-h-10 rounded-full px-4 text-sm font-bold ${x.id === active ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}>
            {x.name}
          </button>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const nc: KitClass = { id: uid(), name: name.trim().slice(0, 30), taught: [], before: emptyTally(), after: emptyTally() };
            update([...classes, nc]);
            setActive(nc.id);
            setName("");
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={k.results.classPlaceholder}
            aria-label={k.results.className}
            className="w-32 rounded-btn border border-line bg-bg px-3 py-2 text-ink focus:border-glow focus:outline-none"
          />
          <Button type="submit" tone="quiet" disabled={!name.trim()}>
            <Plus size={16} weight="bold" /> {k.results.newClass}
          </Button>
        </form>
      </div>

      {c && (
        <>
          <ResultsTable k={k} c={c} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TallyEditor k={k} round="before" tally={c.before} onChange={(before) => patch((x) => ({ ...x, before }))} />
            <TallyEditor k={k} round="after" tally={c.after} onChange={(after) => patch((x) => ({ ...x, after }))} />
          </div>
          <Taught c={c} onToggle={(id) => patch((x) => ({ ...x, taught: x.taught.includes(id) ? x.taught.filter((y) => y !== id) : [...x.taught, id] }))} lang={lang} k={k} />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              tone="quiet"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([totalsCsv(classes)], { type: "text/csv;charset=utf-8" }));
                const a = Object.assign(document.createElement("a"), { href: url, download: "ward-school-kit-totals.csv" });
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              <DownloadSimple size={18} weight="bold" /> {k.results.csv}
            </Button>
            <button
              className="flex min-h-11 items-center gap-2 text-sm font-bold text-alarm"
              onClick={() => {
                if (!confirm(k.results.removeConfirm)) return;
                const rest = classes.filter((x) => x.id !== c.id);
                update(rest);
                setActive(rest[0]?.id ?? null);
              }}
            >
              <Trash size={16} weight="bold" /> {k.results.removeClass}
            </button>
          </div>
          <p className="max-w-[70ch] text-sm text-dim">{k.results.csvNote}</p>
        </>
      )}
    </div>
  );
}

function ResultsTable({ k, c }: { k: KitText; c: KitClass }) {
  const rows = useMemo(() => score(c), [c]);
  const S = k.survey;
  const label = (r: (typeof rows)[number]) => (r.measure === "a" ? S.a[r.index] : r.measure === "tell" ? S.tell : r.measure === "b" ? S.b[r.index] : S.usedWard);
  const sub = (r: (typeof rows)[number]) => k.results.measure[r.measure];
  const small = Math.min(c.before.sheets || Infinity, c.after.sheets || Infinity);
  const ref = useRef<HTMLDivElement>(null);
  const lang = useStore((s) => s.profile.lang);
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {k.results.title}: {c.name}
        </h2>
        <span className="text-sm text-dim">{k.results.lessons(c.taught.length)}</span>
        <Button tone="quiet" className="ms-auto" onClick={() => ref.current && printPart(ref.current, { lang, title: `${k.results.title}: ${c.name}` })}>
          <Printer size={18} weight="bold" /> {k.print}
        </Button>
      </div>
      {small < SMALL && <p className="mb-3 rounded-card bg-alarm-soft px-4 py-3 text-sm font-semibold text-alarm">{k.results.small(small)}</p>}
      <div ref={ref} className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-xs uppercase tracking-wider text-dim">
              <th className="p-3 text-start">{k.results.question}</th>
              <th className="p-3 text-end">
                {k.results.beforeShort} <span className="normal-case">({c.before.sheets})</span>
              </th>
              <th className="p-3 text-end">
                {k.results.afterShort} <span className="normal-case">({c.after.sheets})</span>
              </th>
              <th className="p-3 text-end">{k.results.change}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = r.before != null && r.after != null ? r.after - r.before : null;
              const good = d != null && d !== 0 && (r.lowerIsBetter ? d < 0 : d > 0);
              return (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="p-3">
                    <span className="block font-semibold">{label(r)}</span>
                    <span className="text-xs text-dim">{sub(r)}</span>
                  </td>
                  <td className="p-3 text-end tabular-nums">{r.before ?? "–"}{r.before != null && "%"}</td>
                  <td className="p-3 text-end tabular-nums">{r.after ?? "–"}{r.after != null && "%"}</td>
                  <td className={`p-3 text-end font-bold tabular-nums ${d == null || d === 0 ? "text-dim" : good ? "text-safe" : "text-alarm"}`}>
                    {d == null ? "–" : (
                      <span className="inline-flex items-center gap-1" dir="ltr">
                        {d !== 0 && (good ? <TrendUp size={14} weight="bold" aria-label={k.results.better} /> : <TrendDown size={14} weight="bold" aria-label={k.results.worse} />)}
                        {k.results.pts(d)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="border-t border-line p-3 text-xs text-dim">{k.results.how}</p>
      </div>
    </section>
  );
}

function Num({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={999}
      value={value || ""}
      placeholder="0"
      aria-label={label}
      onChange={(e) => onChange(Math.max(0, Math.min(999, Math.floor(Number(e.target.value) || 0))))}
      className="w-14 rounded-[8px] border border-line bg-bg px-2 py-1.5 text-center tabular-nums text-ink focus:border-glow focus:outline-none"
    />
  );
}

function TallyEditor({ k, round, tally, onChange }: { k: KitText; round: "before" | "after"; tally: Tally; onChange: (t: Tally) => void }) {
  const S = k.survey;
  const roundName = round === "before" ? S.before : S.after;
  const set = (path: (t: Tally) => number[], i: number, n: number) => {
    const next: Tally = structuredClone(tally);
    path(next)[i] = n;
    onChange(next);
  };
  // A function, not a component: a component defined here would remount (and drop focus) on
  // every keystroke.
  const row = (q: string, opts: string[], get: (t: Tally) => number[]) => (
    <div key={q} className="border-t border-line py-2.5">
      <p className="text-sm font-semibold">{q}</p>
      <div className="mt-1.5 flex flex-wrap gap-3">
        {opts.map((o, i) => (
          <label key={o} className="flex items-center gap-1.5 text-xs text-dim">
            <Num value={get(tally)[i]!} onChange={(n) => set(get, i, n)} label={`${q}: ${o}`} />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h3 className="flex items-center gap-3 font-display text-lg font-bold">
        {k.results.enter(roundName)}
        <label className="ms-auto flex items-center gap-2 text-sm font-normal text-dim">
          {k.results.sheets}
          <Num value={tally.sheets} onChange={(n) => onChange({ ...tally, sheets: n })} label={`${roundName}: ${k.results.sheets}`} />
        </label>
      </h3>
      {S.a.map((q, i) => row(q, S.yesNo, (t) => t.a[i]!))}
      {row(S.tell, S.tellOptions, (t) => t.tell)}
      {S.b.map((q, i) => row(q, S.agree, (t) => t.b[i]!))}
      {round === "after" && (
        <Fragment>
          {row(S.usedWard, S.yesNo.slice(0, 2), (t) => t.used)}
          {row(S.parts, S.partsList, (t) => t.parts)}
        </Fragment>
      )}
    </section>
  );
}

function Taught({ c, onToggle, lang, k }: { c: KitClass; onToggle: (id: string) => void; lang: Lang; k: KitText }) {
  // Every lesson across the age bands, so a mixed class can tick what it did.
  const lessons = useMemo(() => {
    const seen = new Map<string, string>();
    for (const age of ["8", "11", "14"] as const) for (const u of unitsFor(age, lang)) for (const l of u.lessons) seen.set(l.id, `${u.title}: ${l.title}`);
    return [...seen];
  }, [lang]);
  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h3 className="font-display text-lg font-bold">{k.results.lessons(c.taught.length)}</h3>
      <p className="mt-1 text-sm text-dim">{k.term.log}</p>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {lessons.map(([id, title]) => (
          <li key={id}>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-btn px-2 hover:bg-raised">
              <input type="checkbox" className="size-5 accent-[var(--glow)]" checked={c.taught.includes(id)} onChange={() => onToggle(id)} />
              <span className="text-sm">{title}</span>
              {c.taught.includes(id) && <CheckCircle size={16} weight="fill" className="ms-auto text-safe" aria-label={k.term.taught} />}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
