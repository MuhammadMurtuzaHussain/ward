// App state. The profile and progress (name, look, streak, XP) live in localStorage on this
// device. Chats are never stored here: an analysis stays in memory until the child chooses to
// save it, and then it goes into the encrypted vault (vault.ts).

import { useSyncExternalStore } from "react";
import type { Analysis, Chat, Level } from "@ward/engine";

export type LookId = "lantern" | "moonlit" | "firefly" | "ember" | "aurora" | "daylight";
export type AgeBand = "8" | "11" | "14";

export type Screen =
  | { name: "home" }
  | { name: "check" }
  | { name: "result"; id: string }
  | { name: "coach"; id: string }
  | { name: "path" }
  | { name: "lesson"; id: string }
  | { name: "vault" }
  | { name: "me" };

export interface CheckSummary {
  id: string;
  at: number;
  title: string;
  level: Level;
  hostile: number;
  saved: boolean;
}

export interface Profile {
  onboarded: boolean;
  name: string;
  age: AgeBand;
  look: LookId;
  xp: number;
  streak: number;
  lastLessonDay: string | null;
  done: string[];
  checks: CheckSummary[];
  trusted: { name: string; how: string }[];
  ollamaUrl: string;
  model: string;
  /** Salt for the vault key. The PIN itself is never stored. */
  vaultSalt: string | null;
  /** An encrypted known value, to check a PIN without storing it. */
  vaultCheck: string | null;
}

const KEY = "ward.profile.v1";

const DEFAULTS: Profile = {
  onboarded: false,
  name: "",
  age: "11",
  look: "lantern",
  xp: 0,
  streak: 0,
  lastLessonDay: null,
  done: [],
  checks: [],
  trusted: [],
  ollamaUrl: "http://127.0.0.1:11434",
  model: "gemma4:e4b",
  vaultSalt: null,
  vaultCheck: null,
};

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/** Work in progress: the open chat and its analysis, in memory only. */
export interface Session {
  chat: Chat;
  analysis: Analysis;
  title: string;
  self: string | null;
  /** Still running the model layer after the instant slang-pack result. */
  refining: boolean;
  progress?: [number, number];
  modelError?: string;
}

interface State {
  profile: Profile;
  screen: Screen;
  history: Screen[];
  sessions: Record<string, Session>;
}

let state: State = { profile: load(), screen: { name: "home" }, history: [], sessions: {} };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setState(fn: (s: State) => State) {
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state.profile));
  } catch {
    // Private mode or storage full: Ward still works for this session.
  }
  applyLook(state.profile);
  emit();
}

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => pick(state),
  );
}

export const getState = () => state;

export function updateProfile(patch: Partial<Profile> | ((p: Profile) => Partial<Profile>)) {
  setState((s) => ({ ...s, profile: { ...s.profile, ...(typeof patch === "function" ? patch(s.profile) : patch) } }));
}

export function go(screen: Screen) {
  setState((s) => ({ ...s, history: [...s.history, s.screen].slice(-20), screen }));
  window.scrollTo({ top: 0 });
}

export function back(fallback: Screen = { name: "home" }) {
  setState((s) => {
    const prev = s.history.at(-1);
    return { ...s, screen: prev ?? fallback, history: s.history.slice(0, -1) };
  });
}

/** Top-level tabs reset history, so Back never walks across tabs. */
export function tab(screen: Screen) {
  setState((s) => ({ ...s, history: [], screen }));
  window.scrollTo({ top: 0 });
}

export function putSession(id: string, patch: Partial<Session> & Pick<Session, "chat" | "analysis" | "title" | "self">) {
  setState((s) => ({ ...s, sessions: { ...s.sessions, [id]: { refining: false, ...s.sessions[id], ...patch } } }));
}

export function patchSession(id: string, patch: Partial<Session>) {
  setState((s) => (s.sessions[id] ? { ...s, sessions: { ...s.sessions, [id]: { ...s.sessions[id]!, ...patch } } } : s));
}

export function applyLook(p: Pick<Profile, "look" | "age">) {
  const root = document.documentElement;
  root.dataset.look = p.look;
  root.dataset.age = p.age;
  document.body.dataset.look = p.look;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--bg").trim() || "#0f1024");
}

export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Streak bookkeeping after a finished lesson: same day keeps it, the next day grows it. */
export function finishLesson(id: string, xp: number) {
  updateProfile((p) => {
    const t = today();
    const y = today(new Date(Date.now() - 86_400_000));
    const streak = p.lastLessonDay === t ? p.streak : p.lastLessonDay === y ? p.streak + 1 : 1;
    return { xp: p.xp + xp, streak, lastLessonDay: t, done: p.done.includes(id) ? p.done : [...p.done, id] };
  });
}

/** A streak only counts if the last lesson was today or yesterday. */
export function liveStreak(p: Profile) {
  const y = today(new Date(Date.now() - 86_400_000));
  return p.lastLessonDay === today() || p.lastLessonDay === y ? p.streak : 0;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
