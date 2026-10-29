import { useEffect } from "react";
import { HouseSimple, MagnifyingGlass, Path, SignOut, UserCircle, Vault } from "@phosphor-icons/react";
import { Ghost } from "./components/Ghost.tsx";
import { applyLook, tab, useStore, type Screen } from "./lib/store.ts";
import { applyPrivacy, quickExit } from "./lib/privacy.ts";
import { useT, type Dict } from "./i18n/index.ts";
import { Onboarding } from "./screens/Onboarding.tsx";
import { Who } from "./screens/Who.tsx";
import { Home } from "./screens/Home.tsx";
import { Check } from "./screens/Check.tsx";
import { Result } from "./screens/Result.tsx";
import { Coach } from "./screens/Coach.tsx";
import { PathScreen } from "./screens/Path.tsx";
import { LessonPlayer } from "./screens/Lesson.tsx";
import { VaultScreen } from "./screens/Vault.tsx";
import { Me } from "./screens/Me.tsx";
import { AdultGuide } from "./screens/AdultGuide.tsx";
import { Teach, TeachLesson } from "./screens/Teach.tsx";
import { Mean } from "./screens/Mean.tsx";
import { StoryPlayer } from "./screens/Story.tsx";
import { Kit } from "./screens/Kit.tsx";
import { Counsel } from "./screens/Counsel.tsx";
import { SafetyPlan } from "./screens/SafetyPlan.tsx";

const NAV: { screen: Screen; label: (t: Dict) => string; icon: typeof HouseSimple }[] = [
  { screen: { name: "home" }, label: (t) => t.nav.home, icon: HouseSimple },
  { screen: { name: "check" }, label: (t) => t.nav.check, icon: MagnifyingGlass },
  { screen: { name: "path" }, label: (t) => t.nav.path, icon: Path },
  { screen: { name: "vault" }, label: (t) => t.nav.vault, icon: Vault },
  { screen: { name: "me" }, label: (t) => t.nav.me, icon: UserCircle },
];

const TAB_OF: Record<Screen["name"], Screen["name"]> = {
  home: "home",
  check: "check",
  result: "check",
  coach: "check",
  path: "path",
  lesson: "path",
  vault: "vault",
  me: "me",
  adults: "me",
  teach: "me",
  teachLesson: "me",
  story: "path",
  kit: "me",
  counsel: "me",
  mean: "home",
  plan: "vault",
};

/** Always in reach: one tap hides Ward and locks it (and on Android drops to the home screen). */
function QuickExit() {
  const t = useT();
  return (
    <button
      onClick={quickExit}
      title={t.common.quickExitHint}
      className="fixed end-3 top-3 z-30 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-[color-mix(in_srgb,var(--bg),transparent_10%)] px-3 text-sm font-bold text-dim backdrop-blur-md hover:text-ink lg:top-4"
    >
      <SignOut size={16} weight="bold" className="flip-rtl" /> {t.common.quickExit}
    </button>
  );
}

export function App() {
  const profile = useStore((s) => s.profile);
  const locked = useStore((s) => s.locked);
  const hideRecents = useStore((s) => s.profiles.hideRecents);
  const screen = useStore((s) => s.screen);
  const t = useT();

  useEffect(() => applyLook(profile), [profile.look, profile.age, profile.lang]);
  useEffect(() => applyPrivacy(), [hideRecents]);

  if (locked) return <Who />;
  if (!profile.onboarded) return <Onboarding />;

  // Lessons take the whole screen, like Duolingo: no nav to tap away from by accident.
  if (screen.name === "lesson") return <LessonPlayer id={screen.id} />;
  if (screen.name === "story") return <StoryPlayer id={screen.id} />;
  // Class mode is projected: the whole screen is the lesson.
  if (screen.name === "teachLesson") return <TeachLesson id={screen.id} />;

  const current = TAB_OF[screen.name];
  return (
    <div className="lg:grid lg:grid-cols-[248px_1fr]">
      <QuickExit />
      <nav aria-label="Ward" className="sticky top-0 hidden h-[100dvh] flex-col border-e border-line px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <Ghost size={34} glow={false} />
          <span className="font-display text-2xl font-bold tracking-tight">Ward</span>
        </div>
        <ul className="grid gap-1">
          {NAV.map(({ screen: s, label, icon: Icon }) => (
            <li key={s.name}>
              <button
                onClick={() => tab(s)}
                aria-current={current === s.name ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-btn px-3 py-3 font-display text-[1.05rem] font-semibold transition-colors ${
                  current === s.name ? "bg-glow-soft text-glow" : "text-dim hover:bg-raised hover:text-ink"
                }`}
              >
                <Icon size={24} weight={current === s.name ? "fill" : "regular"} />
                {label(t)}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-auto px-2 text-xs leading-relaxed text-dim">{t.nav.runsHere}</p>
      </nav>

      <main className="min-h-[100dvh] pt-10 lg:pt-0">
        {screen.name === "home" && <Home />}
        {screen.name === "check" && <Check />}
        {screen.name === "result" && <Result id={screen.id} />}
        {screen.name === "coach" && <Coach id={screen.id} />}
        {screen.name === "path" && <PathScreen />}
        {screen.name === "vault" && <VaultScreen />}
        {screen.name === "me" && <Me />}
        {screen.name === "adults" && <AdultGuide />}
        {screen.name === "teach" && <Teach />}
        {screen.name === "mean" && <Mean />}
        {screen.name === "kit" && <Kit />}
        {screen.name === "counsel" && <Counsel />}
        {screen.name === "plan" && <SafetyPlan />}
      </main>

      <nav
        aria-label="Ward"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-[color-mix(in_srgb,var(--bg),transparent_8%)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ screen: s, label, icon: Icon }) => (
            <li key={s.name}>
              <button
                onClick={() => tab(s)}
                aria-current={current === s.name ? "page" : undefined}
                className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.72rem] font-bold ${current === s.name ? "text-glow" : "text-dim"}`}
              >
                <Icon size={24} weight={current === s.name ? "fill" : "regular"} />
                {label(t)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
