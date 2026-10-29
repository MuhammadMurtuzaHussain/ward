// Shared-phone privacy: the quick exit, and keeping Ward out of Android's recent-apps screen.

import { Capacitor, registerPlugin } from "@capacitor/core";
import { getState, lockProfile } from "./store.ts";

const Privacy = registerPlugin<{ setSecure(o: { enabled: boolean }): Promise<void>; leave(): Promise<void> }>("Privacy");
const android = () => Capacitor.getPlatform() === "android";

export function applyPrivacy() {
  if (android()) void Privacy.setSecure({ enabled: getState().profiles.hideRecents }).catch(() => {});
}

/**
 * Quick exit: forget open chats, lock the vault, go back to "Who's using Ward?" (which asks for
 * a PIN if the profile has one), and on Android drop to the home screen.
 */
export function quickExit() {
  lockProfile();
  if (android()) void Privacy.leave().catch(() => {});
}

/** Desktop: pressing Escape twice quickly is the quick exit. */
export function listenForQuickExitKey() {
  let last = 0;
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const now = Date.now();
    if (now - last < 600) quickExit();
    last = now;
  });
}
