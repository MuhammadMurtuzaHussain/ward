// Auto-lock: when Ward has been out of sight (another app, the home screen, a minimised window)
// it locks itself, so a brother or sister who picks the phone up next finds "Who's using Ward?"
// and the PIN, not the child's open chat. Only when there is a PIN to lock with. The rule is
// here, with no timers or listeners, so it can be tested; appLife.ts wires it to the platform.

export type AutoLock = "now" | "minute" | "off";
export const AUTO_LOCKS: AutoLock[] = ["now", "minute", "off"];

/** "minute" by default: a quick look at WhatsApp doesn't throw away the check that's open. */
export const DEFAULT_AUTO_LOCK: AutoLock = "minute";

const AFTER: Record<AutoLock, number> = { now: 0, minute: 60_000, off: Infinity };

/** Leaving to pick a file (the chat export) isn't leaving Ward, for up to this long. */
export const PICKER_GRACE = 5 * 60_000;

export interface Away {
  setting: AutoLock;
  /** The profile or its vault has a PIN. */
  hasPin: boolean;
  /** How long Ward was out of sight. */
  awayFor: number;
  /** Ward itself opened a file picker just before going out of sight. */
  picking: boolean;
}

export function shouldLock({ setting, hasPin, awayFor, picking }: Away): boolean {
  if (!hasPin || setting === "off") return false;
  if (picking && awayFor < PICKER_GRACE) return false;
  return awayFor >= AFTER[setting];
}
