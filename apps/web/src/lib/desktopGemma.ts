// Gemma 4 inside Ward for desktop (desktop/gemma.mjs, llama.cpp in Electron's main process). The
// page reaches it only through window.wardDesktop, a few IPC calls the preload exposes. Same
// prompt and schema as Gemma through Ollama; the reply never leaves the computer.

import { JSON_INSTRUCTION, type Transport } from "@ward/engine";

export interface DesktopStatus {
  /** llama.cpp loaded on this computer. False hides the feature. */
  available: boolean;
  runtimeError: string | null;
  gpu: string | null;
  ramBytes: number;
  supported: boolean;
  name: string;
  modelBytes: number;
  downloaded: boolean;
  partialBytes: number;
  freeBytes: number;
  downloading: boolean;
  loaded: boolean;
}

export interface DesktopProgress {
  loaded: number;
  total: number;
  verifying?: boolean;
}

interface Bridge {
  gemma: {
    status(): Promise<DesktopStatus>;
    download(): Promise<void>;
    cancel(): Promise<void>;
    remove(): Promise<void>;
    generate(o: { system?: string; prompt: string; schema?: object; temperature?: number; maxTokens?: number }): Promise<string>;
    onProgress(fn: (p: DesktopProgress) => void): () => void;
  };
  lab: {
    status(): Promise<{ on: boolean; flag: boolean }>;
    set(on: boolean): Promise<{ on: boolean; flag: boolean }>;
  };
}

/** What "How I worked this out" shows for the built-in Gemma; Result.tsx words it per language. */
export const BUILT_IN_GEMMA = "Gemma 4 E4B (built into Ward)";

export const desktop = (): Bridge | undefined => (window as { wardDesktop?: Bridge }).wardDesktop;

export async function desktopStatus(): Promise<DesktopStatus | null> {
  const d = desktop();
  if (!d) return null;
  try {
    return await d.gemma.status();
  } catch {
    return null;
  }
}

/** Downloaded and runnable here: the built-in Gemma can read. */
export async function desktopReady(): Promise<boolean> {
  const s = await desktopStatus();
  return !!s?.available && s.downloaded;
}

export async function downloadDesktopGemma(onProgress: (p: DesktopProgress) => void) {
  const d = desktop()!;
  const off = d.gemma.onProgress(onProgress);
  try {
    await d.gemma.download();
  } finally {
    off();
  }
}

export const cancelDesktopGemma = () => desktop()?.gemma.cancel();
export const removeDesktopGemma = () => desktop()?.gemma.remove();

/**
 * For GemmaJudge: the system prompt, the chat and the JSON schema go over IPC; text comes back.
 * llama.cpp's grammar holds the reply to the schema. Left to itself Gemma closes the list at once
 * ("messages": []), so the grammar also asks for exactly one entry per JUDGE line, and the prompt
 * spells the shape out in words.
 */
export const desktopTransport: Transport = (system, user, schema) => {
  const judged = (user.match(/^JUDGE #/gm) ?? []).length;
  const s = structuredClone(schema) as { properties?: { messages?: { minItems?: number; maxItems?: number } } };
  if (judged && s.properties?.messages) Object.assign(s.properties.messages, { minItems: judged, maxItems: judged });
  return desktop()!.gemma.generate({ system, prompt: `${user}\n\n${JSON_INSTRUCTION}`, schema: s, temperature: 0 });
};

/** Writing (the message to a trusted adult, feedback on lesson answers), when Ollama isn't there. */
export async function desktopWrite(prompt: string, temperature = 0.3): Promise<string | null> {
  if (!(await desktopReady())) return null;
  try {
    const text = (await desktop()!.gemma.generate({ prompt, temperature, maxTokens: 400 })).trim();
    return text || null;
  } catch {
    return null;
  }
}

/** Lab mode: Ward keeps nothing between sessions on this computer. */
export async function labStatus() {
  try {
    return (await desktop()?.lab.status()) ?? null;
  } catch {
    return null;
  }
}

export const setLab = (on: boolean) => desktop()?.lab.set(on);
