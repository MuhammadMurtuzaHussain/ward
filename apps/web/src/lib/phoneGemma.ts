// Gemma 4 E2B on the phone (Android, LiteRT-LM, mobile/android/.../GemmaPhonePlugin.kt). Same
// prompt and schema as the computer's Gemma 4; the reply never leaves the phone.

import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { GemmaJudge, type ModelJudgement } from "@ward/engine";

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
 * Until Gemma 4 E2B's scorecard says otherwise it is raise-only, like Ward Lite. See
 * eval/results/scorecard.md: if E2B matches E4B, it earns full authority to clear banter.
 */
export const PHONE_AUTHORITY: ModelJudgement["authority"] = "raise-only";

/** A judge running on the phone's Gemma, or null if it isn't downloaded or won't start. */
export async function phoneJudge(): Promise<GemmaJudge | null> {
  const s = await phoneStatus();
  if (!s?.downloaded) return null;
  try {
    await GemmaPhone.load();
  } catch {
    return null;
  }
  return new GemmaJudge({
    name: "Gemma 4 E2B on this phone",
    authority: PHONE_AUTHORITY,
    batch: 10,
    transport: async (system, prompt, schema) => (await GemmaPhone.generate({ system, prompt, schema: JSON.stringify(schema) })).text,
  });
}
