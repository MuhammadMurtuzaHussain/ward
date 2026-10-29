import type { Level } from "@ward/engine";
import { Pill } from "./ui.tsx";
import { useT } from "../i18n/index.ts";

export function LevelPill({ level }: { level: Level }) {
  const t = useT();
  const tone = level === "urgent" || level === "bullying" ? "alarm" : level === "watch" ? "glow" : "safe";
  return <Pill tone={tone}>{t.level[level]}</Pill>;
}
