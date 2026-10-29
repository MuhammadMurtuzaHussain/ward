// The Haunting: what Ward found in a chat. The verdict first, in plain words, then the patterns
// (the part a single-message filter can't see), who is doing it, and the timeline itself with
// the hurtful messages lit up and the ordinary stretches folded away.

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  CaretDown,
  ChatCircleText,
  Lifebuoy,
  ChatsCircle,
  Ghost as GhostIcon,
  HandPalm,
  MoonStars,
  Repeat,
  TrendUp,
  UsersThree,
  Warning,
  type Icon,
} from "@phosphor-icons/react";
import type { Analysis, Finding, Level, PatternKind } from "@ward/engine";
import { Ghost, type Mood } from "../components/Ghost.tsx";
import { HelpNow } from "../components/HelpNow.tsx";
import { BackBar, Button, Pill, Screen } from "../components/ui.tsx";
import { go, useStore, type AgeBand } from "../lib/store.ts";
import { SaveToVault } from "../components/SaveToVault.tsx";
import { Speak } from "../components/Speak.tsx";
import { patternText } from "../lib/patternText.ts";
import { LessonSuggestions } from "../components/LessonSuggestions.tsx";
import { locale, useT, type Dict } from "../i18n/index.ts";

const PATTERN_ICON: Record<PatternKind, Icon> = {
  danger: Warning,
  campaign: Repeat,
  pileon: UsersThree,
  ghosts: GhostIcon,
  exclusion: HandPalm,
  nightwatch: MoonStars,
  escalating: TrendUp,
};

function verdict(level: Level, age: AgeBand, self: string | null, t: Dict): { mood: Mood; title: string; line: string } {
  const you = self ? t.result.you : t.result.yourFriend;
  const your = self ? t.result.your : t.result.their;
  const moods: Record<Level, Mood> = { urgent: "worried", bullying: "calm", watch: "think", calm: "happy" };
  const [title, line] = t.result.verdict[level];
  return {
    mood: moods[level],
    title: level === "bullying" && age !== "8" ? t.result.bullyingTeen : title,
    line: line(you, your),
  };
}

export function Result({ id }: { id: string }) {
  const s = useStore((st) => st.sessions[id]);
  const age = useStore((st) => st.profile.age);
  const t = useT();
  const reduce = useReducedMotion();

  if (!s) {
    return (
      <Screen>
        <BackBar />
        <p className="text-dim">{t.result.closed}</p>
        <Button className="mt-4" onClick={() => go({ name: "check" })}>
          {t.home.checkChat}
        </Button>
      </Screen>
    );
  }

  const a = s.analysis;
  const v = verdict(a.level, age, s.self, t);
  const danger = a.patterns.find((p) => p.kind === "danger");
  const imageRisk = a.findings.some((f) => f.severity >= 3 && (f.categories.includes("sexual") || f.categories.includes("exposure")));
  const hostile = a.findings.filter((f) => f.severity > 0 && f.message.sender !== s.self);
  // The child's own messages that could land hard: often anger after being hurt. Named gently.
  const ownHarsh = s.self ? a.findings.some((f) => f.severity >= 2 && f.message.sender === s.self) : false;

  return (
    <Screen wide>
      <BackBar title={s.title} right={<RefineStatus refining={s.refining} progress={s.progress} error={s.modelError} />} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-8">
        <div className="grid gap-5 lg:sticky lg:top-6">
          <motion.section
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-5 rounded-card border border-line bg-surface p-6"
          >
            <Ghost mood={v.mood} size={age === "14" ? 72 : 88} className="shrink-0" />
            <div>
              <h1 className={`font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl ${a.level === "urgent" ? "text-alarm" : ""}`}>{v.title}</h1>
              <p className="mt-2 leading-relaxed">{v.line}</p>
              <Speak text={[v.title, v.line, ...a.patterns.map((p) => patternText(p, t))]} className="mt-3" />
            </div>
          </motion.section>

          {danger && <HelpNow images={imageRisk} />}
          {danger && age === "14" && s.self && (
            <Button tone="quiet" onClick={() => go({ name: "plan" })}>
              <Lifebuoy size={20} weight="bold" /> {t.plan.open}
            </Button>
          )}

          {a.patterns.length > 0 ? (
            <section aria-labelledby="patterns">
              <h2 id="patterns" className="font-display text-lg font-bold tracking-tight">
                {t.result.noticed}
              </h2>
              <ul className="mt-3 grid gap-3">
                {a.patterns.map((p, i) => {
                  const I = PATTERN_ICON[p.kind];
                  return (
                    <motion.li
                      key={p.kind}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="flex gap-4"
                    >
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full ${p.kind === "danger" ? "bg-alarm-soft text-alarm" : "bg-glow-soft text-glow"}`}>
                        <I size={20} weight="bold" />
                      </span>
                      <span>
                        <span className="block font-display font-bold">{t.result.patternTitle[p.kind]}</span>
                        <span className="text-dim">{patternText(p, t)}</span>
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {hostile.length > 0 && <Who analysis={a} self={s.self} />}

          <div className="sticky bottom-20 z-10 grid gap-2 rounded-card bg-[color-mix(in_srgb,var(--bg),transparent_10%)] py-2 backdrop-blur-md sm:grid-cols-2 lg:static lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {a.level !== "calm" ? (
              <Button onClick={() => go({ name: "coach", id })}>
                {t.result.whatToDo} <ArrowRight size={18} weight="bold" className="flip-rtl" />
              </Button>
            ) : (
              <Button onClick={() => go({ name: "path" })}>{t.result.practise}</Button>
            )}
            <SaveToVault id={id} />
          </div>

          {ownHarsh && (
            <button onClick={() => go({ name: "mean" })} className="flex items-start gap-4 rounded-card border border-line bg-surface p-4 text-start hover:border-dim/40">
              <ChatCircleText size={24} weight="bold" className="mt-0.5 shrink-0 text-glow" />
              <span>
                <span className="block font-display font-bold">{t.mean.fromResult[0]}</span>
                <span className="text-sm text-dim">{t.mean.fromResult[1]}</span>
              </span>
            </button>
          )}

          <LessonSuggestions analysis={a} self={s.self} />

          <HowWardKnows analysis={a} />
        </div>

        <Timeline analysis={a} self={s.self} />
      </div>
    </Screen>
  );
}

function RefineStatus({ refining, progress, error }: { refining: boolean; progress?: [number, number]; error?: string }) {
  const t = useT();
  if (refining)
    return (
      <Pill tone="glow">
        <span className="size-2 animate-pulse rounded-full bg-glow" aria-hidden />
        {t.result.readingClosely}
        {progress ? ` ${progress[0]}/${progress[1]}` : ""}
      </Pill>
    );
  if (error) return <Pill>{t.result.quickCheck}</Pill>;
  return null;
}

function Who({ analysis, self }: { analysis: Analysis; self: string | null }) {
  const t = useT();
  const ghosts = new Set(analysis.patterns.find((p) => p.kind === "ghosts")?.senders ?? []);
  const people = analysis.senders.filter((x) => x.hostile > 0 && x.name !== self);
  const upstanders = analysis.senders.filter((x) => x.hostile === 0 && x.name !== self && x.total > 0);
  return (
    <section aria-labelledby="who">
      <h2 id="who" className="font-display text-lg font-bold tracking-tight">
        {t.result.who}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {people.map((x) => (
          <li key={x.name} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${x.worst >= 3 ? "border-alarm/50" : "border-line"}`}>
            {ghosts.has(x.name) && <GhostIcon size={16} weight="fill" className="text-glow" aria-label={t.result.ghostAccount} />}
            <span className="font-semibold">{x.name}</span>
            <span className="text-sm text-dim">{x.hostile}</span>
          </li>
        ))}
      </ul>
      {upstanders.length > 0 && (
        <p className="mt-3 text-sm text-dim">{t.result.notPartOf(upstanders.slice(0, 4).map((u) => u.name).join(", "), Math.max(0, upstanders.length - 4))}</p>
      )}
    </section>
  );
}

function HowWardKnows({ analysis }: { analysis: Analysis }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="text-sm">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-11 items-center gap-2 font-bold text-dim hover:text-ink">
        {t.result.how}
        <CaretDown size={14} weight="bold" className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div className="grid gap-2 text-dim">
          <p>
            {t.result.howLists(analysis.layers.packs.length)}
            {analysis.layers.models.includes("Ward Lite")
              ? t.result.howLite
              : analysis.layers.models.length
                ? t.result.howModel(analysis.layers.models.join(" + "))
                : t.result.howNone}
          </p>
          <p>{t.result.howPrivate}</p>
        </div>
      )}
    </div>
  );
}

type Row = { kind: "msg"; f: Finding } | { kind: "fold"; count: number; from: number } | { kind: "day"; label: string };

export function Timeline({ analysis, self }: { analysis: Analysis; self: string | null }) {
  const t = useT();
  const [unfolded, setUnfolded] = useState<Set<number>>(new Set());
  const rows = useMemo(() => {
    const out: Row[] = [];
    let lastDay = "";
    let quiet: Finding[] = [];
    const flushQuiet = () => {
      if (!quiet.length) return;
      // Keep one line of context either side of an attack; fold longer quiet stretches.
      if (quiet.length <= 3 || unfolded.has(quiet[0]!.message.id)) quiet.forEach((f) => out.push({ kind: "msg", f }));
      else {
        out.push({ kind: "msg", f: quiet[0]! });
        out.push({ kind: "fold", count: quiet.length - 2, from: quiet[0]!.message.id });
        out.push({ kind: "msg", f: quiet.at(-1)! });
      }
      quiet = [];
    };
    for (const f of analysis.findings) {
      const day = f.message.at ? f.message.at.toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "short" }) : "";
      if (day && day !== lastDay) {
        flushQuiet();
        out.push({ kind: "day", label: day });
        lastDay = day;
      }
      const loud = f.severity > 0 && f.message.sender !== self;
      if (loud) {
        flushQuiet();
        out.push({ kind: "msg", f });
      } else quiet.push(f);
    }
    flushQuiet();
    return out;
  }, [analysis, self, unfolded]);

  return (
    <section aria-labelledby="timeline" className="rounded-card border border-line bg-surface p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <ChatsCircle size={22} weight="bold" className="text-glow" />
        <h2 id="timeline" className="font-display text-lg font-bold tracking-tight">
          {t.result.theChat}
        </h2>
        <span className="ms-auto text-sm text-dim">{t.result.messages(analysis.findings.length)}</span>
      </div>
      <ol className="mt-4 grid gap-2">
        {rows.map((r, i) => {
          if (r.kind === "day")
            return (
              <li key={`d${i}`} className="py-2 text-center text-xs font-bold uppercase tracking-wider text-dim">
                {r.label}
              </li>
            );
          if (r.kind === "fold")
            return (
              <li key={`f${r.from}`} className="text-center">
                <button onClick={() => setUnfolded((u) => new Set(u).add(r.from))} className="min-h-10 rounded-full px-3 text-sm font-bold text-dim hover:bg-raised hover:text-ink">
                  {t.result.ordinary(r.count)}
                </button>
              </li>
            );
          return <Bubble key={r.f.message.id} f={r.f} mine={r.f.message.sender === self} />;
        })}
      </ol>
    </section>
  );
}

function Bubble({ f, mine }: { f: Finding; mine: boolean }) {
  const t = useT();
  const lang = useStore((s) => s.profile.lang);
  const m = f.message;
  // Word-list notes carry English glosses; in Urdu, show just the words that were caught.
  const why = lang === "ur" && !f.model && f.hits.length ? f.hits.map((h) => `"${h.term}"`).join("، ") : f.why;
  const loud = f.severity > 0 && !mine;
  const late = m.at && (m.at.getHours() >= 23 || m.at.getHours() < 5);
  const edge = f.severity >= 3 ? "border-alarm bg-alarm-soft" : f.severity === 2 ? "border-glow/70 bg-glow-soft" : f.severity === 1 ? "border-line bg-raised" : "border-transparent bg-raised/60";
  return (
    <li className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className={`max-w-[88%] rounded-[calc(var(--r-card)-6px)] border px-4 py-2.5 ${mine ? "border-transparent bg-glow-soft" : loud ? edge : "border-transparent bg-raised/60"}`}>
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-bold ${loud ? "text-ink" : "text-dim"}`}>{mine ? t.result.youSender : m.sender}</span>
          {m.at && (
            <span className="text-dim">
              {m.at.toLocaleTimeString(locale(), { hour: "numeric", minute: "2-digit" })}
              {late && <MoonStars size={12} weight="fill" className="ms-1 inline text-glow" aria-label={t.result.lateNight} />}
            </span>
          )}
        </div>
        <p dir="auto" className={`mt-0.5 whitespace-pre-wrap break-words ${loud ? "" : "text-dim"}`}>{m.media ? <i>{t.result.media}</i> : m.text}</p>
      </div>
      {loud && why && (
        <p className={`mt-1 max-w-[88%] px-1 text-sm ${f.severity >= 3 ? "font-bold text-alarm" : "text-dim"}`}>
          {f.severity >= 3 && <Warning size={14} weight="fill" className="me-1 inline" />}
          {why}
        </p>
      )}
    </li>
  );
}

