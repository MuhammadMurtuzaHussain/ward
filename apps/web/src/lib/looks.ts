import type { AgeBand, LookId } from "./store.ts";

export const LOOKS: { id: LookId; name: string; line: string; bg: string; glow: string; raised: string }[] = [
  { id: "lantern", name: "Lantern", line: "Indigo night, warm amber light", bg: "#0f1024", glow: "#ffb547", raised: "#20234a" },
  { id: "moonlit", name: "Moonlit", line: "Deep sea blue, pale moon", bg: "#0b1418", glow: "#ece5ae", raised: "#1a2d35" },
  { id: "firefly", name: "Firefly", line: "Forest at night, green sparks", bg: "#0c140f", glow: "#c9ef5d", raised: "#1b2c21" },
  { id: "ember", name: "Ember", line: "Plum dusk, coral coals", bg: "#160e13", glow: "#ff8d6e", raised: "#2d1d27" },
  { id: "aurora", name: "Aurora", line: "Polar sky, mint lights", bg: "#0a0f1e", glow: "#63eecb", raised: "#192440" },
  { id: "daylight", name: "Daylight", line: "Bright, for reading in the day", bg: "#eceef6", glow: "#f0a12a", raised: "#e2e5f1" },
];

export const AGES: { id: AgeBand; label: string; line: string }[] = [
  { id: "8", label: "8 to 10", line: "Bigger buttons, more Ward" },
  { id: "11", label: "11 to 13", line: "The in-between" },
  { id: "14", label: "14 to 17", line: "Straight talk, less cartoon" },
];
