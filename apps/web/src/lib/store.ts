// App state. Each person on the device has a profile (name, look, streak, XP) in localStorage,
// so siblings on a shared phone each get their own Ward; a profile can be locked with a PIN.
// Chats are never stored here: an analysis stays in memory until the child chooses to save it,
// and then it goes into that profile's encrypted vault (vault.ts).

import { useSyncExternalStore } from "react";
import type { Analysis, Chat, Level } from "@ward/engine";

export type LookId = "lantern" | "moonlit" | "firefly" | "ember" | "aurora" | "daylight";
export type AgeBand = "8" | "11" | "14";
export type Lang = "en" | "ur";

export type Screen =
  | { name: "home" }
  | { name: "check" }
  | { name: "result"; id: string }
  | { name: "coach"; id: string }
  | { name: "path" }
  | { name: "lesson"; id: string }
  | { name: "vault" }
  | { name: "me" }
  | { name: "adults" }
  | { name: "teach" }
  | { name: "teachLesson"; id: string }
  | { name: "mean" }
  | { name: "plan" };

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
  lang: Lang;
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
  /** Show "Listen" buttons. Defaults on for the youngest band, set in onboarding's age step. */
  readAloud: boolean;
}

/** The single-profile key from before shared-phone mode; migrated into the "default" profile. */
const LEGACY_KEY = "ward.profile.v1";
const INDEX_KEY = "ward.profiles.v1";
const profileKey = (id: string) => (id === "default" ? LEGACY_KEY : `ward.profile.${id}`);

/** What the "Who's using Ward?" screen needs, readable before a profile is unlocked. */
export interface ProfileEntry {
  id: string;
  name: string;
  look: LookId;
  /** PBKDF2 of the profile PIN; the PIN itself is never stored. */
  pinSalt?: string;
  pinHash?: string;
}

export interface ProfileIndex {
  list: ProfileEntry[];
  active: string;
  /** Hide Ward's screen in the recent-apps switcher (Android). On by default. */
  hideRecents: boolean;
}

const DEFAULTS: Profile = {
  onboarded: false,
  // Urdu by default on phones set to Urdu; everyone can switch on the first screen.
  lang: typeof navigator !== "undefined" && navigator.language?.startsWith("ur") ? "ur" : "en",
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
  readAloud: false,
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage full: Ward still works for this session.
  }
}

function loadIndex(): ProfileIndex {
  const idx = read<ProfileIndex>(INDEX_KEY);
  if (idx?.list?.length) return { ...idx, hideRecents: idx.hideRecents ?? true };
  // First run, or a device from before profiles: the existing data becomes "default".
  const legacy = read<Profile>(LEGACY_KEY);
  return { list: [{ id: "default", name: legacy?.name ?? "", look: legacy?.look ?? "lantern" }], active: "default", hideRecents: true };
}

function loadProfile(id: string): Profile {
  return { ...DEFAULTS, ...(read<Profile>(profileKey(id)) ?? {}) };
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
  profiles: ProfileIndex;
  /** True until the active profile's PIN is entered, or while choosing who is using Ward. */
  locked: boolean;
  screen: Screen;
  history: Screen[];
  sessions: Record<string, Session>;
  /** A chat shared into Ward from another app, waiting for the Check screen. */
  incoming: { files: File[]; text?: string; title?: string } | null;
}

const index0 = loadIndex();
const firstLocked = index0.list.length > 1 || !!index0.list.find((p) => p.id === index0.active)?.pinHash;
let state: State = {
  profile: loadProfile(index0.active),
  profiles: index0,
  locked: firstLocked,
  screen: { name: "home" },
  history: [],
  sessions: {},
  incoming: null,
};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setState(fn: (s: State) => State) {
  state = fn(state);
  const { profile, profiles } = state;
  write(profileKey(profiles.active), profile);
  // Keep the picker's name and look in step with the profile.
  const entry = profiles.list.find((p) => p.id === profiles.active);
  if (entry && (entry.name !== profile.name || entry.look !== profile.look)) {
    state = { ...state, profiles: { ...profiles, list: profiles.list.map((p) => (p.id === profiles.active ? { ...p, name: profile.name, look: profile.look } : p)) } };
  }
  write(INDEX_KEY, state.profiles);
  applyLook(state.locked ? { look: entry?.look ?? "lantern", age: "11", lang: profile.lang } : profile);
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

export function applyLook(p: Pick<Profile, "look" | "age"> & Partial<Pick<Profile, "lang">>) {
  const root = document.documentElement;
  root.dataset.look = p.look;
  root.dataset.age = p.age;
  if (p.lang) {
    root.lang = p.lang;
    root.dir = p.lang === "ur" ? "rtl" : "ltr";
  }
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

// ---- Shared phones -------------------------------------------------------------------------

const enc = new TextEncoder();
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))));

async function pinHash(pin: string, salt: string) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: Uint8Array.from(atob(salt), (c) => c.charCodeAt(0)), iterations: 310_000, hash: "SHA-256" }, base, 256);
  return b64(bits);
}

/** Things to forget whenever the person using Ward changes: open chats, an unlocked vault. */
const onLeave = new Set<() => void>();
export function onProfileLeave(fn: () => void) {
  onLeave.add(fn);
}

function leave(s: State): State {
  for (const fn of onLeave) fn();
  return { ...s, sessions: {}, incoming: null, history: [], screen: { name: "home" } };
}

export function activeEntry(): ProfileEntry | undefined {
  return state.profiles.list.find((p) => p.id === state.profiles.active);
}

/** Open a profile. Returns false if it has a PIN and the PIN is wrong. */
export async function openProfile(id: string, pin?: string): Promise<boolean> {
  const entry = state.profiles.list.find((p) => p.id === id);
  if (!entry) return false;
  if (entry.pinHash && (!pin || (await pinHash(pin, entry.pinSalt!)) !== entry.pinHash)) return false;
  setState((s) => ({ ...leave(s), profiles: { ...s.profiles, active: id }, profile: loadProfile(id), locked: false }));
  return true;
}

export function addProfile() {
  const id = Math.random().toString(36).slice(2, 10);
  setState((s) => ({
    ...leave(s),
    profiles: { ...s.profiles, list: [...s.profiles.list, { id, name: "", look: "lantern" }], active: id },
    profile: { ...DEFAULTS, lang: s.profile.lang },
    locked: false,
  }));
}

export async function setProfilePin(pin: string | null) {
  const salt = pin ? b64(crypto.getRandomValues(new Uint8Array(16))) : undefined;
  const hash = pin ? await pinHash(pin, salt!) : undefined;
  setState((s) => ({ ...s, profiles: { ...s.profiles, list: s.profiles.list.map((p) => (p.id === s.profiles.active ? { ...p, pinSalt: salt, pinHash: hash } : p)) } }));
}

/** Delete a profile and its data from this device (its vault is removed by the caller). */
export function removeActiveProfile() {
  const id = state.profiles.active;
  try {
    localStorage.removeItem(profileKey(id));
  } catch {
    // nothing stored
  }
  const rest = state.profiles.list.filter((p) => p.id !== id);
  if (!rest.length) {
    try {
      localStorage.removeItem(INDEX_KEY);
    } catch {
      // nothing stored
    }
    location.reload();
    return;
  }
  setState((s) => ({ ...leave(s), profiles: { ...s.profiles, list: rest, active: rest[0]!.id }, profile: loadProfile(rest[0]!.id), locked: true }));
}

/** Who's using Ward? Also the quick exit's landing place. */
export function lockProfile() {
  setState((s) => ({ ...leave(s), locked: true }));
}

export function setHideRecents(on: boolean) {
  setState((s) => ({ ...s, profiles: { ...s.profiles, hideRecents: on } }));
}

export const vaultDbName = () => (state.profiles.active === "default" ? "ward-vault" : `ward-vault-${state.profiles.active}`);
