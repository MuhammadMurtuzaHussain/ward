import type { Level } from "@ward/engine";
import { Pill } from "./ui.tsx";

export const LEVEL_LABEL: Record<Level, string> = {
  calm: "Looks okay",
  watch: "Keep an eye",
  bullying: "Bullying",
  urgent: "Get help now",
};

export function LevelPill({ level }: { level: Level }) {
  const tone = level === "urgent" || level === "bullying" ? "alarm" : level === "watch" ? "glow" : "safe";
  return <Pill tone={tone}>{LEVEL_LABEL[level]}</Pill>;
}
