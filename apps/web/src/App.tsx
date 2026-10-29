import { useEffect } from "react";
import { HouseSimple, MagnifyingGlass, Path, UserCircle, Vault } from "@phosphor-icons/react";
import { Ghost } from "./components/Ghost.tsx";
import { applyLook, tab, useStore, type Screen } from "./lib/store.ts";
import { Onboarding } from "./screens/Onboarding.tsx";
import { Home } from "./screens/Home.tsx";
import { Check } from "./screens/Check.tsx";
import { Result } from "./screens/Result.tsx";
import { Coach } from "./screens/Coach.tsx";
import { PathScreen } from "./screens/Path.tsx";
import { LessonPlayer } from "./screens/Lesson.tsx";
import { VaultScreen } from "./screens/Vault.tsx";
import { Me } from "./screens/Me.tsx";

const NAV: { screen: Screen; label: string; icon: typeof HouseSimple }[] = [
  { screen: { name: "home" }, label: "Home", icon: HouseSimple },
  { screen: { name: "check" }, label: "Check", icon: MagnifyingGlass },
  { screen: { name: "path" }, label: "Path", icon: Path },
  { screen: { name: "vault" }, label: "Vault", icon: Vault },
  { screen: { name: "me" }, label: "Me", icon: UserCircle },
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
};

export function App() {
  const profile = useStore((s) => s.profile);
  const screen = useStore((s) => s.screen);

  useEffect(() => applyLook(profile), [profile.look, profile.age]);

  if (!profile.onboarded) return <Onboarding />;

  // Lessons take the whole screen, like Duolingo: no nav to tap away from by accident.
  if (screen.name === "lesson") return <LessonPlayer id={screen.id} />;

  const current = TAB_OF[screen.name];
  return (
    <div className="lg:grid lg:grid-cols-[248px_1fr]">
      <nav aria-label="Ward" className="sticky top-0 hidden h-[100dvh] flex-col border-r border-line px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <Ghost size={34} glow={false} />
          <span className="font-display text-2xl font-bold tracking-tight">Ward</span>
        </div>
        <ul className="grid gap-1">
          {NAV.map(({ screen: s, label, icon: Icon }) => (
            <li key={label}>
              <button
                onClick={() => tab(s)}
                aria-current={current === s.name ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-btn px-3 py-3 font-display text-[1.05rem] font-semibold transition-colors ${
                  current === s.name ? "bg-glow-soft text-glow" : "text-dim hover:bg-raised hover:text-ink"
                }`}
              >
                <Icon size={24} weight={current === s.name ? "fill" : "regular"} />
                {label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-auto px-2 text-xs leading-relaxed text-dim">Runs on this device. Your chats never leave it.</p>
      </nav>

      <main className="min-h-[100dvh]">
        {screen.name === "home" && <Home />}
        {screen.name === "check" && <Check />}
        {screen.name === "result" && <Result id={screen.id} />}
        {screen.name === "coach" && <Coach id={screen.id} />}
        {screen.name === "path" && <PathScreen />}
        {screen.name === "vault" && <VaultScreen />}
        {screen.name === "me" && <Me />}
      </main>

      <nav
        aria-label="Ward"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-[color-mix(in_srgb,var(--bg),transparent_8%)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ screen: s, label, icon: Icon }) => (
            <li key={label}>
              <button
                onClick={() => tab(s)}
                aria-current={current === s.name ? "page" : undefined}
                className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.72rem] font-bold ${current === s.name ? "text-glow" : "text-dim"}`}
              >
                <Icon size={24} weight={current === s.name ? "fill" : "regular"} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
