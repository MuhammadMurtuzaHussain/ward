// App state. Each person on the device has a profile (name, look, streak, XP) in localStorage,
// so siblings on a shared phone each get their own Ward; a profile can be locked with a PIN.
// Chats are never stored here: an analysis stays in memory until the child chooses to save it,
// and then it goes into that profile's encrypted vault (vault.ts). The child's "this is wrong"
// corrections are kept here by message fingerprint only, never the words (corrections.ts).

import { useSyncExternalStore } from "react";
import type { Analysis, Chat } from "@ward/engine";
import { withCorrection, type Correction } from "./corrections.ts";
import { neutral, type CheckSummary } from "./history.ts";
import { profilePinHash, type Locks } from "./pinGate.ts";
import { DEFAULT_AUTO_LOCK, type AutoLock } from "./autoLock.ts";
import { b64 } from "./vaultSeal.ts";

export type LookId = "lantern" | "moonlit" | "firefly" | "ember" | "aurora" | "daylight";
export type AgeBand = "8" | "11" | "14";
export type Lang = "en" | "ur";

export type Screen =
  | { name: "home" }
  | { name: "check" }
  | { name: "result"; id: string }
  | { name: "coach"; id: string; felt?: boolean } // felt: from "It still feels wrong", so help comes first
  | { name: "path" }
  | { name: "lesson"; id: string }
  | { name: "vault" }
  | { name: "me" }
  | { name: "adults" }
  | { name: "teach" }
  | { name: "teachLesson"; id: string }
  | { name: "story"; id: string }
  | { name: "kit" }
  | { name: "counsel" }
  | { name: "give" }
  | { name: "mean" }
  | { name: "plan" };

export type { CheckSummary };

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
  /** Story endings found, as "storyId:sceneId". */
  storyEnds: string[];
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
  /** "This is wrong": the child's corrections, by message fingerprint. */
  corrections: Record<string, Correction>;
  /** The helplines the child picked (a country id, or "OTHER"); null means guess from the time zone. */
  region: string | null;
  /** Lock Ward when it's been out of sight (autoLock.ts). Only does anything once there's a PIN. */
  autoLock: AutoLock;
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
  storyEnds: [],
  checks: [],
  trusted: [],
  ollamaUrl: "http://127.0.0.1:11434",
  model: "gemma4:e4b",
  vaultSalt: null,
  vaultCheck: null,
  readAloud: false,
  corrections: {},
  region: null,
  autoLock: DEFAULT_AUTO_LOCK,
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
  const p = { ...DEFAULTS, ...(read<Profile>(profileKey(id)) ?? {}) };
  // Older lists kept chat names and verdicts in plain text; they're cleaned on the next write.
  return { ...p, checks: neutral(p.checks) };
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
// Every profile on the phone, not just the one opening: lists from before history.ts kept chat
// names and verdicts in plain text.
for (const { id } of index0.list) {
  const stored = read<Profile>(profileKey(id));
  if (stored?.checks?.some((c) => Object.keys(c).some((k) => !["id", "at", "saved"].includes(k)))) write(profileKey(id), { ...stored, checks: neutral(stored.checks) });
}
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

/** A story ending found. The first ending of each story earns XP and keeps the streak going. */
export function finishStory(storyId: string, endId: string, xp = 10) {
  const key = `${storyId}:${endId}`;
  updateProfile((p) => {
    if (p.storyEnds.includes(key)) return {};
    const first = !p.storyEnds.some((k) => k.startsWith(`${storyId}:`));
    const t = today();
    const y = today(new Date(Date.now() - 86_400_000));
    const streak = !first || p.lastLessonDay === t ? p.streak : p.lastLessonDay === y ? p.streak + 1 : 1;
    return { storyEnds: [...p.storyEnds, key], ...(first ? { xp: p.xp + xp, streak, lastLessonDay: t } : {}) };
  });
}

/** A streak only counts if the last lesson was today or yesterday. */
export function liveStreak(p: Profile) {
  const y = today(new Date(Date.now() - 86_400_000));
  return p.lastLessonDay === today() || p.lastLessonDay === y ? p.streak : 0;
}

/** "Forget this list": the recent-checks lines go. Saved chats stay in the vault. */
export function forgetChecks() {
  updateProfile({ checks: [] });
}

/** Remember (or, with null, forget) the child's correction to one message. */
export function setCorrection(fp: string, c: Correction | null) {
  updateProfile((p) => ({ corrections: withCorrection(p.corrections, fp, c) }));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

// ---- Shared phones -------------------------------------------------------------------------

const pinHash = profilePinHash;

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

/** This profile's PINs, for asking before something that can't be undone (pinGate.ts). */
export function currentLocks(): Locks {
  const e = activeEntry();
  const { vaultSalt, vaultCheck } = state.profile;
  return {
    profile: e?.pinHash && e.pinSalt ? { salt: e.pinSalt, hash: e.pinHash } : undefined,
    vault: vaultSalt && vaultCheck ? { salt: vaultSalt, check: vaultCheck } : undefined,
  };
}

/** Open a profile. Returns false if it has a PIN and the PIN is wrong. */
export async function openProfile(id: string, pin?: string): Promise<boolean> {
  const entry = state.profiles.list.find((p) => p.id === id);
  if (!entry) return false;
  if (entry.pinHash && (!pin || (await pinHash(pin, entry.pinSalt!)) !== entry.pinHash)) return false;
  setState((s) => {
    // A chat shared into Ward while it was auto-locked is waiting for the same person.
    const kept: Partial<State> = id === s.profiles.active && s.incoming ? { incoming: s.incoming, screen: { name: "check" } } : {};
    return { ...leave(s), ...kept, profiles: { ...s.profiles, active: id }, profile: loadProfile(id), locked: false };
  });
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

/** The profile or its vault has a PIN, so there's something to lock with. */
export const hasAnyPin = () => Boolean(activeEntry()?.pinHash || state.profile.vaultSalt);

/** Auto-lock (appLife.ts): like the quick exit, but a chat being shared in right now waits. */
export function autoLockProfile() {
  setState((s) => ({ ...leave(s), incoming: s.incoming, locked: true }));
}

export function setHideRecents(on: boolean) {
  setState((s) => ({ ...s, profiles: { ...s.profiles, hideRecents: on } }));
}

export const vaultDbName = () => (state.profiles.active === "default" ? "ward-vault" : `ward-vault-${state.profiles.active}`);
