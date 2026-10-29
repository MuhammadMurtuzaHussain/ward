// Counsellor mode: a school counsellor's (or any trusted adult's) Ward. Children hand over a
// ward.report/v1 as a file or a loop of QR codes; Ward checks it wasn't edited, lays the case out
// safety first, and keeps the adult's notes with it. Cases are sealed in the vault under the same
// PIN and never leave the device: there's no server anywhere.

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, FileArrowUp, Printer, QrCode, Trash, WarningOctagon } from "@phosphor-icons/react";
import { checkReport, reportProblem, type WardReport } from "@ward/engine";
import { LevelPill } from "../components/LevelPill.tsx";
import { PinPad } from "../components/PinPad.tsx";
import { QrScan } from "../components/QrScan.tsx";
import { BackBar, Button, Pill, Screen } from "../components/ui.tsx";
import { printPart } from "../lib/printPart.ts";
import { createPin, hasPin, isUnlocked, listCases, removeCase, saveCase, unlock, type CaseRecord } from "../lib/vault.ts";
import { useStore } from "../lib/store.ts";
import { locale, useT } from "../i18n/index.ts";

async function contentId(r: WardReport) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(r)));
  return [...new Uint8Array(h)].slice(0, 12).map((x) => x.toString(16).padStart(2, "0")).join("");
}

const when = (iso: string | number | null) => (iso == null ? "" : new Date(iso).toLocaleString(locale(), { dateStyle: "medium", timeStyle: "short" }));

export function Counsel() {
  const t = useT();
  const [gate, setGate] = useState<"create" | "confirm" | "unlock" | null>(() => (!hasPin() ? "create" : !isUnlocked() ? "unlock" : null));
  const [first, setFirst] = useState("");
  return (
    <Screen wide>
      <BackBar title={t.counsel.title} />
      {gate === "create" && <PinPad title={t.vault.makePin} hint={t.counsel.needPin} onDone={(p) => (setFirst(p), setGate("confirm"))} />}
      {gate === "confirm" && (
        <PinPad
          key="confirm"
          title={t.vault.again}
          hint={t.vault.againHint}
          onDone={async (p) => {
            if (p !== first) {
              setGate("create");
              return false;
            }
            await createPin(p);
            setGate(null);
          }}
        />
      )}
      {gate === "unlock" && <PinPad title={t.vault.unlock} hint={t.vault.unlockHint} onDone={async (p) => (await unlock(p)) && (setGate(null), true)} />}
      {gate === null && <Cases />}
    </Screen>
  );
}

function Cases() {
  const t = useT();
  const [cases, setCases] = useState<CaseRecord[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const reload = () => listCases().then(setCases);
  useEffect(() => void reload(), []);

  async function receive(text: string, via: "file" | "qr") {
    setNote(null);
    let r: WardReport;
    try {
      r = JSON.parse(text);
    } catch {
      return setNote(t.counsel.bad.json!);
    }
    const problem = reportProblem(r);
    if (problem) return setNote(t.counsel.bad[problem] ?? t.counsel.bad.json!);
    // Keyed by the whole report, not the digest it claims: an edited copy must never hide
    // behind (or be hidden by) the genuine case with the same claimed digest.
    const id = await contentId(r);
    const existing = (await listCases()).find((c) => c.id === id);
    if (existing) setNote(t.counsel.dup);
    else await saveCase({ id, receivedAt: Date.now(), via, report: r, check: await checkReport(r), status: "new", notes: [] });
    await reload();
    setOpen(id);
  }

  const current = cases?.find((c) => c.id === open) ?? null;
  if (current)
    return (
      <CaseView
        c={current}
        onBack={() => setOpen(null)}
        onChange={async (next) => {
          await saveCase(next);
          await reload();
        }}
        onDelete={async () => {
          await removeCase(current.id);
          setOpen(null);
          await reload();
        }}
        note={note}
      />
    );

  if (scanning)
    return (
      <QrScan
        onCancel={() => setScanning(false)}
        onText={(text) => {
          setScanning(false);
          void receive(text, "qr");
        }}
      />
    );

  return (
    <div className="grid gap-6">
      <p className="max-w-[70ch] text-dim">{t.counsel.intro}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => file.current?.click()}>
          <FileArrowUp size={20} weight="bold" /> {t.counsel.openFile}
        </Button>
        <Button tone="quiet" onClick={() => setScanning(true)}>
          <QrCode size={20} weight="bold" /> {t.counsel.scan}
        </Button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) await receive(await f.text(), "file");
          }}
        />
      </div>
      {note && (
        <p role="alert" className="rounded-card bg-alarm-soft px-4 py-3 font-semibold text-alarm">
          {note}
        </p>
      )}
      {cases === null ? (
        <div className="grid gap-3" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-surface" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <p className="text-dim">{t.counsel.empty}</p>
      ) : (
        <ul className="grid gap-3">
          {cases.map((c) => {
            const ok = c.check.digestOk && c.check.perMessage.every(Boolean);
            return (
              <li key={c.id}>
                <button onClick={() => setOpen(c.id)} className="flex w-full items-center gap-4 rounded-card border border-line bg-surface p-4 text-start hover:border-dim/40">
                  {ok ? <CheckCircle size={24} weight="fill" className="shrink-0 text-safe" aria-label={t.counsel.verified} /> : <WarningOctagon size={24} weight="fill" className="shrink-0 text-alarm" aria-label={t.counsel.changed} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-semibold" dir="auto">
                      {c.report.conversation.title}
                      {c.report.reporter.firstName ? ` · ${c.report.reporter.firstName}` : ""}
                    </span>
                    <span className="text-sm text-dim">{t.counsel.received(when(c.receivedAt), c.via === "qr")}</span>
                  </span>
                  <Pill tone={c.status === "new" ? "glow" : "quiet"}>{t.counsel.status[c.status]}</Pill>
                  <LevelPill level={c.report.safety.level} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CaseView({ c, onBack, onChange, onDelete, note }: { c: CaseRecord; onBack: () => void; onChange: (c: CaseRecord) => void; onDelete: () => void; note: string | null }) {
  const t = useT();
  const lang = useStore((s) => s.profile.lang);
  const [draft, setDraft] = useState("");
  const sheet = useRef<HTMLDivElement>(null);
  const r = c.report;
  const n = r.incidents.length;
  const okCount = c.check.perMessage.filter(Boolean).length;
  const ok = c.check.digestOk && okCount === n;
  const rep = r.reporter;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={onBack} className="-ms-2 flex min-h-11 items-center gap-2 rounded-full px-2 font-bold text-dim hover:text-ink">
          <ArrowLeft size={20} weight="bold" className="flip-rtl" /> {t.counsel.all}
        </button>
        <div className="ms-auto flex flex-wrap gap-2" role="radiogroup">
          {(["new", "open", "closed"] as const).map((s) => (
            <button key={s} role="radio" aria-checked={c.status === s} onClick={() => onChange({ ...c, status: s })} className={`min-h-10 rounded-full px-4 text-sm font-bold ${c.status === s ? "bg-glow text-glow-ink" : "bg-raised text-dim hover:text-ink"}`}>
              {t.counsel.status[s]}
            </button>
          ))}
          <Button tone="quiet" onClick={() => sheet.current && printPart(sheet.current, { lang, title: r.conversation.title })}>
            <Printer size={18} weight="bold" /> {t.counsel.print}
          </Button>
        </div>
      </div>
      {note && <p className="mb-4 rounded-card bg-glow-soft px-4 py-3 font-semibold">{note}</p>}

      <div ref={sheet} className="grid gap-5">
        <div className={`rounded-card border p-4 ${ok ? "border-safe/40 bg-[color-mix(in_srgb,var(--surface),var(--safe)_12%)]" : "border-alarm/50 bg-alarm-soft"}`} role={ok ? "status" : "alert"}>
          <p className={`font-display text-lg font-bold ${ok ? "text-safe" : "text-alarm"}`}>{ok ? t.counsel.verified : t.counsel.changed}</p>
          <p className="text-sm">{ok ? t.counsel.verifiedLine(n, when(r.integrity.savedAt)) : t.counsel.changedLine(n - okCount, n)}</p>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight" dir="auto">
          {r.conversation.title}
        </h1>
        <p className="-mt-3 text-sm text-dim">
          {t.counsel.received(when(c.receivedAt), c.via === "qr")} · {r.conversation.platform} · {r.conversation.messages} / {r.conversation.participants}
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-dim">{t.counsel.safety}</h2>
            <p className={`mt-1 font-display text-lg font-bold ${r.safety.inDangerNow ? "text-alarm" : ""}`}>
              {r.safety.inDangerNow === true ? t.counsel.danger.yes : r.safety.inDangerNow === false ? t.counsel.danger.no : t.counsel.danger.skip}
            </p>
            <p className="mt-1 text-sm">{t.counsel.reading(t.level[r.safety.level])}</p>
          </section>
          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-dim">{t.counsel.wants}</h2>
            {r.wants.length ? (
              <ul className="mt-1 list-disc ps-5">
                {r.wants.map((w) => (
                  <li key={w.id}>{t.report.wantLabels[w.id] ?? w.label}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-dim">{t.counsel.notSaid}</p>
            )}
          </section>
          <section className="rounded-card border border-line bg-surface p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-dim">{t.counsel.child}</h2>
            {Object.keys(rep).length ? (
              <p className="mt-1" dir="auto">
                {[rep.firstName, rep.ageBand ? t.ages[rep.ageBand as "8" | "11" | "14"]?.[0] : null, rep.city, rep.country].filter(Boolean).join(" · ")}
              </p>
            ) : (
              <p className="mt-1 text-dim">{t.counsel.notShared}</p>
            )}
          </section>
        </div>

        {r.patterns.length > 0 && (
          <ul className="grid list-disc gap-1 ps-5 text-dim">
            {r.patterns.map((p) => (
              <li key={p.kind}>{p.fact}</li>
            ))}
          </ul>
        )}

        <section>
          <h2 className="font-display text-lg font-bold">{t.counsel.accounts}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {r.accounts.map((a) => (
              <li key={a.name} className={`rounded-full border px-3 py-1.5 text-sm ${a.worstSeverity >= 3 ? "border-alarm/50" : "border-line"}`}>
                <b dir="auto">{a.name}</b> <span className="text-dim">{a.hurtfulMessages}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">{t.counsel.incidents(n)}</h2>
          <ol className="mt-2 grid gap-2">
            {r.incidents.map((i, k) => (
              <li key={k} className={`rounded-btn border bg-surface px-4 py-3 ${i.severity >= 3 ? "border-alarm/50" : "border-line"}`}>
                <div className="flex flex-wrap items-center gap-2 text-xs text-dim">
                  <b className="text-ink" dir="auto">{i.from}</b>
                  <span>{when(i.at)}</span>
                  <span className={`rounded-full px-2 py-0.5 font-bold ${i.severity >= 3 ? "bg-alarm-soft text-alarm" : "bg-raised"}`}>{t.counsel.severity[i.severity]}</span>
                  {c.check.perMessage[k] ? <CheckCircle size={14} weight="fill" className="ms-auto text-safe" aria-label={t.counsel.verified} /> : <WarningOctagon size={14} weight="fill" className="ms-auto text-alarm" aria-label={t.counsel.changed} />}
                </div>
                <p dir="auto" className="mt-1 whitespace-pre-wrap break-words font-semibold">{i.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold">{t.counsel.notes}</h2>
          <ol className="mt-2 grid gap-2">
            {c.notes.map((x) => (
              <li key={x.at} className="rounded-btn bg-raised px-4 py-3">
                <p className="text-xs text-dim">{when(x.at)}</p>
                <p dir="auto" className="mt-0.5 whitespace-pre-wrap">{x.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <form
        className="mt-3 grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onChange({ ...c, status: c.status === "new" ? "open" : c.status, notes: [...c.notes, { at: Date.now(), text: draft.trim().slice(0, 4000) }] });
          setDraft("");
        }}
      >
        <textarea
          value={draft}
          dir="auto"
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.counsel.notePlaceholder}
          aria-label={t.counsel.notes}
          className="w-full resize-y rounded-card border border-line bg-surface p-4 text-ink placeholder:text-dim/70 focus:border-glow focus:outline-none"
        />
        <Button type="submit" className="justify-self-start" disabled={!draft.trim()}>
          {t.counsel.addNote}
        </Button>
      </form>

      <button
        className="mt-10 flex min-h-11 items-center gap-2 text-sm font-bold text-alarm"
        onClick={() => confirm(t.counsel.delConfirm) && onDelete()}
      >
        <Trash size={18} weight="bold" /> {t.counsel.del}
      </button>
    </div>
  );
}
