// Gemma 4 E2B on the phone (Android, LiteRT-LM, mobile/android/.../GemmaPhonePlugin.kt). Same
// prompt and schema as the computer's Gemma 4; the reply never leaves the phone.

import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface PhoneStatus {
  ramBytes: number;
  supported: boolean;
  modelBytes: number;
  downloaded: boolean;
  partialBytes: number;
  freeBytes: number;
  downloading: boolean;
  loaded: boolean;
  backend: string | null;
}

const GemmaPhone = registerPlugin<{
  status(): Promise<PhoneStatus>;
  download(): Promise<void>;
  cancelDownload(): Promise<void>;
  load(): Promise<{ backend: string }>;
  generate(o: { system: string; prompt: string; schema?: string }): Promise<{ text: string }>;
  remove(): Promise<void>;
  addListener(e: "progress", fn: (p: { loaded: number; total: number }) => void): Promise<PluginListenerHandle>;
}>("GemmaPhone");

export const phoneGemmaPossible = () => Capacitor.getPlatform() === "android";

export async function phoneStatus(): Promise<PhoneStatus | null> {
  if (!phoneGemmaPossible()) return null;
  try {
    return await GemmaPhone.status();
  } catch {
    return null;
  }
}

export async function downloadPhoneGemma(onProgress: (loaded: number, total: number) => void) {
  const h = await GemmaPhone.addListener("progress", (p) => onProgress(p.loaded, p.total));
  try {
    await GemmaPhone.download();
  } finally {
    await h.remove();
  }
}

export const cancelPhoneGemma = () => GemmaPhone.cancelDownload();
export const removePhoneGemma = () => GemmaPhone.remove();

/**
 * Gemma 4 E2B on the phone writes; it doesn't judge. On the scorecard it caught about a third of
 * abuse (eval/results/scorecard.md) where Ward Lite catches 83 to 85% in a 38 MB model, so Ward
 * Lite reads the chats and the phone's Gemma drafts the message to a trusted adult and gives
 * feedback on written lesson answers, which a classifier can't do.
 */
export async function phoneWrite(prompt: string): Promise<string | null> {
  const s = await phoneStatus();
  if (!s?.downloaded) return null;
  try {
    await GemmaPhone.load();
    const text = (await GemmaPhone.generate({ system: "", prompt })).text.trim();
    return text || null;
  } catch {
    return null;
  }
}
