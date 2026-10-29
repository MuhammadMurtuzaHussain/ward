import { ArrowRight, ChatCircleText, Fire, Lifebuoy, Lightning, LockKey, MagnifyingGlass, type Icon } from "@phosphor-icons/react";
import { nextLesson } from "@ward/lessons";
import { Ghost, type Mood } from "../components/Ghost.tsx";
import { Button, Card, Pill, Screen } from "../components/ui.tsx";
import { LevelPill } from "../components/LevelPill.tsx";
import { go, liveStreak, tab, useStore } from "../lib/store.ts";
import { UnitIcon } from "../components/UnitIcon.tsx";
import { Speak } from "../components/Speak.tsx";
import { locale, useT } from "../i18n/index.ts";

export function Home() {
  const p = useStore((s) => s.profile);
  const t = useT();
  const streak = liveStreak(p);
  const up = nextLesson(p.age, p.done, p.lang);
  const late = new Date().getHours() >= 23 || new Date().getHours() < 5;
  const lastBad = p.checks.find((c) => c.level === "bullying" || c.level === "urgent");

  let mood: Mood = "happy";
  let line = t.home.lineDefault;
  if (late) {
    mood = "sleep";
    line = t.home.lineLate;
  } else if (lastBad && Date.now() - lastBad.at < 3 * 86_400_000) {
    mood = "calm";
    line = t.home.lineAfter;
  } else if (streak >= 3) {
    mood = "cheer";
    line = t.home.lineStreak(streak);
  }

  return (
    <Screen wide>
      <header className="flex items-center justify-between gap-3">
        <p className="font-display text-xl font-semibold tracking-tight text-dim">
          {t.home.greeting(new Date().getHours())}
          {p.name ? <span className="text-ink">{p.lang === "ur" ? "، " : ", "}{p.name}</span> : null}
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
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button onClick={() => go({ name: "check" })}>
                  <MagnifyingGlass size={20} weight="bold" /> {t.home.checkChat}
                </Button>
                <Speak text={line} />
              </div>
            </div>
          </div>
        </section>

        {up ? (
          <button
            onClick={() => go({ name: "lesson", id: up.lesson.id })}
            className="group flex flex-col justify-between rounded-card border border-line bg-raised p-6 text-start transition-transform active:scale-[0.99]"
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
              {streak && p.lastLessonDay === new Date().toISOString().slice(0, 10) ? t.home.oneMore : t.home.todaysLesson}
              <ArrowRight size={18} weight="bold" className="flip-rtl transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        ) : (
          <Card className="p-6">
            <p className="font-display text-xl font-bold">{t.home.pathDone}</p>
            <p className="mt-1 text-dim">{t.home.pathDoneLine}</p>
          </Card>
        )}
      </div>

      <div className={`mt-5 grid gap-3 ${p.age === "14" ? "sm:grid-cols-2" : ""}`}>
        <SideDoor icon={ChatCircleText} text={t.mean.homeCard} onClick={() => go({ name: "mean" })} />
        {p.age === "14" && <SideDoor icon={Lifebuoy} text={t.plan.card} onClick={() => go({ name: "plan" })} />}
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">{t.home.recent}</h2>
          {p.checks.length > 0 && (
            <button className="text-sm font-bold text-glow" onClick={() => tab({ name: "vault" })}>
              {t.nav.vault}
            </button>
          )}
        </div>
        {p.checks.length === 0 ? (
          <p className="mt-3 max-w-[50ch] text-dim">{t.home.recentEmpty}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {p.checks.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center gap-4 rounded-card border border-line bg-surface px-4 py-3.5">
                <LevelPill level={c.level} />
                <span className="min-w-0 flex-1 truncate font-semibold">{c.title}</span>
                {c.saved && <LockKey size={18} className="shrink-0 text-dim" aria-label={t.home.savedInVault} />}
                <span className="shrink-0 text-sm text-dim">{new Date(c.at).toLocaleDateString(locale(), { day: "numeric", month: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}

/** A quiet card for the less common doors: "Was I mean?" and the safety plan. */
function SideDoor({ icon: I, text: [title, line], onClick }: { icon: Icon; text: [string, string]; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-4 rounded-card border border-line bg-surface px-5 py-4 text-start hover:border-dim/40">
      <I size={24} weight="bold" className="shrink-0 text-glow" />
      <span className="min-w-0 flex-1">
        <span className="block font-display font-semibold">{title}</span>
        <span className="text-sm text-dim">{line}</span>
      </span>
      <ArrowRight size={18} weight="bold" className="flip-rtl shrink-0 text-glow transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
