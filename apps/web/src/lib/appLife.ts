// Ward being put down and picked up again. Auto-lock: when Ward comes back after being out of
// sight, it locks if the child's setting says so (the rule is in autoLock.ts). And Android's
// Back button: it closes a dialog, then steps back a screen, then goes Home, and on Home it
// sends Ward to the background instead of closing it, so a check in progress isn't lost.

import { useEffect, useRef } from "react";
import { App as Native } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { closeTopDialog } from "../components/Dialog.tsx";
import { autoLockProfile, back, getState, hasAnyPin, tab } from "./store.ts";
import { shouldLock } from "./autoLock.ts";

let hiddenAt: number | null = null;
let pickedAt = 0;

/** Ward is about to open the file picker: going out of sight for it isn't leaving Ward. */
export function choosingFile() {
  pickedAt = Date.now();
}

function away() {
  hiddenAt ??= Date.now();
}

function returned() {
  if (hiddenAt === null) return;
  const now = Date.now();
  const awayFor = now - hiddenAt;
  const picking = pickedAt > 0 && hiddenAt - pickedAt < 5_000;
  hiddenAt = null;
  pickedAt = 0;
  const s = getState();
  if (s.locked || !s.profile.onboarded) return;
  if (shouldLock({ setting: s.profile.autoLock, hasPin: hasAnyPin(), awayFor, picking })) autoLockProfile();
}

// A screen's own "back" (a vault item open, the PIN pad on "Who's using Ward?"), top one last.
const local: (() => void)[] = [];

/** While `onBack` is a function, Android's Back calls it instead of leaving the screen. */
export function useBack(onBack: (() => void) | false | null) {
  const fn = useRef(onBack);
  fn.current = onBack;
  const on = typeof onBack === "function";
  useEffect(() => {
    if (!on) return;
    const h = () => (fn.current as () => void)();
    local.push(h);
    return () => void local.splice(local.indexOf(h), 1);
  }, [on]);
}

function onBack() {
  if (closeTopDialog()) return;
  const own = local.at(-1);
  if (own) return own();
  const s = getState();
  if (!s.locked && s.profile.onboarded) {
    if (s.history.length) return back();
    if (s.screen.name !== "home") return tab({ name: "home" });
  }
  void Native.minimizeApp();
}

export function listenForAppLife() {
  if (Capacitor.isNativePlatform()) {
    void Native.addListener("appStateChange", ({ isActive }) => (isActive ? returned() : away()));
    if (Capacitor.getPlatform() === "android") void Native.addListener("backButton", onBack);
  } else {
    // The browser and the desktop app: a hidden tab, a minimised window.
    document.addEventListener("visibilitychange", () => (document.hidden ? away() : returned()));
  }
}
