import { ArrowRight, Fire, Lightning, LockKey, MagnifyingGlass } from "@phosphor-icons/react";
import { nextLesson } from "@ward/lessons";
import { Ghost, type Mood } from "../components/Ghost.tsx";
import { Button, Card, Pill, Screen } from "../components/ui.tsx";
import { LevelPill } from "../components/LevelPill.tsx";
import { go, liveStreak, tab, useStore } from "../lib/store.ts";
import { UnitIcon } from "../components/UnitIcon.tsx";

function greeting(h = new Date().getHours()) {
  if (h < 5) return "Still up";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export function Home() {
  const p = useStore((s) => s.profile);
  const streak = liveStreak(p);
  const up = nextLesson(p.age, p.done);
  const late = new Date().getHours() >= 23 || new Date().getHours() < 5;
  const lastBad = p.checks.find((c) => c.level === "bullying" || c.level === "urgent");

  let mood: Mood = "happy";
  let line = "Got a chat that feels off? Show me. I'll read it here and tell you what I see.";
  if (late) {
    mood = "sleep";
    line = "It's late. Mean messages feel worse at night. They'll still be there in the morning, and so will I.";
  } else if (lastBad && Date.now() - lastBad.at < 3 * 86_400_000) {
    mood = "calm";
    line = "How are you doing after that chat? You don't have to deal with it on your own.";
  } else if (streak >= 3) {
    mood = "cheer";
    line = `${streak} days in a row. You're getting harder to knock down.`;
  }

  return (
    <Screen wide>
      <header className="flex items-center justify-between gap-3">
        <p className="font-display text-xl font-semibold tracking-tight text-dim">
          {greeting()}
          {p.name ? <span className="text-ink">, {p.name}</span> : null}
        </p>
        <div className="flex items-center gap-2">
          <Pill tone={streak ? "glow" : "quiet"}>
            <Fire size={16} weight="fill" /> {streak}
          </Pill>
          <Pill>
            <Lightning size={16} weight="fill" /> {p.xp} XP
          </Pill>
        </div>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
        <section className="relative overflow-hidden rounded-card border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Ghost mood={mood} size={p.age === "14" ? 92 : 116} />
            <div className="min-w-0">
              <p className="max-w-[36ch] text-[1.15rem] leading-relaxed">{line}</p>
              <Button className="mt-5" onClick={() => go({ name: "check" })}>
                <MagnifyingGlass size={20} weight="bold" /> Check a chat
              </Button>
            </div>
          </div>
        </section>

        {up ? (
          <button
            onClick={() => go({ name: "lesson", id: up.lesson.id })}
            className="group flex flex-col justify-between rounded-card border border-line bg-raised p-6 text-left transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 text-glow">
              <UnitIcon icon={up.unit.icon} />
              <span className="font-display font-semibold">{up.unit.title}</span>
            </div>
            <div className="mt-6">
              <p className="font-display text-2xl font-bold tracking-tight">{up.lesson.title}</p>
              <p className="mt-1 text-dim">{up.lesson.line}</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-display font-semibold text-glow">
              {streak && p.lastLessonDay === new Date().toISOString().slice(0, 10) ? "One more?" : "Today's lesson"}
              <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        ) : (
          <Card className="p-6">
            <p className="font-display text-xl font-bold">Path complete</p>
            <p className="mt-1 text-dim">You've done every lesson for your age. Replay any of them from Path.</p>
          </Card>
        )}
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">Recent checks</h2>
          {p.checks.length > 0 && (
            <button className="text-sm font-bold text-glow" onClick={() => tab({ name: "vault" })}>
              Vault
            </button>
          )}
        </div>
        {p.checks.length === 0 ? (
          <p className="mt-3 max-w-[50ch] text-dim">
            Nothing yet. When you check a chat, a short note appears here: what I found, never the messages themselves.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {p.checks.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center gap-4 rounded-card border border-line bg-surface px-4 py-3.5">
                <LevelPill level={c.level} />
                <span className="min-w-0 flex-1 truncate font-semibold">{c.title}</span>
                {c.saved && <LockKey size={18} className="shrink-0 text-dim" aria-label="Saved in vault" />}
                <span className="shrink-0 text-sm text-dim">{new Date(c.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}
