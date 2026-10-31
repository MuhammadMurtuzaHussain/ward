// "Give Ward to a friend": on Android, Ward sends its own installed APK through the share sheet
// (Bluetooth, Quick Share, any app that takes a file) with no internet (GiveWardPlugin.kt).
// Everywhere else, and for app-store installs that come in pieces, the friend gets the link.

import { Capacitor, registerPlugin } from "@capacitor/core";

export const RELEASES_URL = "https://github.com/MuhammadMurtuzaHussain/ward/releases/latest";

export interface ApkInfo {
  version: string;
  /** Installed as several APKs (an app store did it): can't be sent as one file. */
  split: boolean;
  bytes: number;
  apkSha256: string;
  /** The signing certificate's SHA-256: the same on every genuine copy of Ward. */
  certSha256: string;
}

const GiveWard = registerPlugin<{
  info(): Promise<ApkInfo>;
  share(o: { title: string }): Promise<{ name: string }>;
}>("GiveWard");

export const canGiveApk = () => Capacitor.getPlatform() === "android";

export async function apkInfo(): Promise<ApkInfo | null> {
  if (!canGiveApk()) return null;
  try {
    return await GiveWard.info();
  } catch {
    return null;
  }
}

/** Opens the share sheet with Ward-<version>.apk. Rejects with code "SPLIT" for split installs. */
export const shareApk = (title: string) => GiveWard.share({ title });

/** 64 hex characters as 16 groups of four, easy to compare box by box or read aloud. */
export function fingerprintGroups(hex: string): string[] {
  return hex.toUpperCase().match(/.{1,4}/g) ?? [];
}
