// Running a check. The slang packs and pattern engine answer instantly, so the child sees
// something within a moment; then, if a model is available on this device, Gemma reads the
// chat with context and the result sharpens in place.

import { unzipSync, strFromU8 } from "fflate";
import { analyze, GemmaJudge, ollamaModels, parseChat, type Chat } from "@ward/engine";
import { getState, go, patchSession, putSession, uid, updateProfile } from "./store.ts";
import { liteAvailable, WardLiteJudge } from "./lite.ts";
import { BUILT_IN_GEMMA, desktopReady, desktopTransport } from "./desktopGemma.ts";
import type { Judge } from "@ward/engine";
import { t } from "../i18n/index.ts";

export async function readChatFile(file: File): Promise<{ text: string; title: string }> {
  const base = file.name.replace(/\.(txt|zip)$/i, "");
  const title = base.replace(/^WhatsApp Chat (with|-) /i, "").trim() || "Chat";
  if (/\.zip$/i.test(file.name)) {
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const name = Object.keys(files).find((n) => /(^|\/)_chat\.txt$/i.test(n)) ?? Object.keys(files).find((n) => n.toLowerCase().endsWith(".txt"));
    if (!name) throw new Error("That zip has no chat text in it. Export again and choose \"Without media\".");
    return { text: strFromU8(files[name]!), title };
  }
  return { text: await file.text(), title };
}

export function parse(text: string): Chat {
  return parseChat(text);
}

export type ModelStatus = { ok: true; model: string; via: "ollama" | "builtIn" } | { ok: false; reason: string };

/** The strongest Gemma on this computer: Ollama's if it's there, else the one built into Ward for desktop. */
export async function modelStatus(): Promise<ModelStatus> {
  const { ollamaUrl, model } = getState().profile;
  const models = await ollamaModels(ollamaUrl);
  if (models.includes(model)) return { ok: true, model, via: "ollama" };
  if (await desktopReady()) return { ok: true, model: BUILT_IN_GEMMA, via: "builtIn" };
  if (!models.length) return { ok: false, reason: "No model running on this device" };
  return { ok: false, reason: `${model} isn't downloaded` };
}

export async function startCheck(chat: Chat, self: string | null, title: string) {
  const id = uid();
  const quick = await analyze(chat, { self });
  putSession(id, { chat, analysis: quick, title, self, refining: true });
  updateProfile((p) => ({
    checks: [
      { id, at: Date.now(), title, level: quick.level, hostile: quick.findings.filter((f) => f.severity > 0).length, saved: false },
      ...p.checks,
    ].slice(0, 50),
  }));
  go({ name: "result", id });

  // Tiers: Gemma 4 on this computer (or the paired family computer) reads closest, with authority
  // to clear friendly banter: through Ollama if it's there, else built into Ward for desktop
  // (llama.cpp, same prompt and schema). Everywhere else Ward Lite reads, inside the app,
  // raise-only. (The phone's Gemma 4 E2B writes but doesn't judge: see phoneGemma.ts.)
  const status = await modelStatus();
  const language = t().draft.gemmaLanguage;
  let judge: Judge | null = null;
  if (status.ok && status.via === "ollama") judge = new GemmaJudge({ baseUrl: getState().profile.ollamaUrl, model: status.model, batch: 16, language });
  else if (status.ok) judge = new GemmaJudge({ transport: desktopTransport, name: BUILT_IN_GEMMA, batch: 16, language });
  else if (await liteAvailable()) judge = new WardLiteJudge();
  if (!judge) {
    patchSession(id, { refining: false, modelError: status.ok ? undefined : status.reason });
    return id;
  }
  try {
    const full = await analyze(chat, {
      self,
      judges: [judge],
      onProgress: (d, t) => patchSession(id, { progress: [d, t] }),
    });
    patchSession(id, { analysis: full, refining: false, progress: undefined });
    updateProfile((p) => ({
      checks: p.checks.map((c) => (c.id === id ? { ...c, level: full.level, hostile: full.findings.filter((f) => f.severity > 0).length } : c)),
    }));
  } catch (e) {
    patchSession(id, { refining: false, modelError: e instanceof Error ? e.message : String(e) });
  }
  return id;
}

/**
 * Screenshots: Gemma's vision reads them into "Name: message" lines. Desktop with Ollama only for
 * now: the Gemma built into Ward reads text, not images (node-llama-cpp has no vision support yet).
 */
export async function readScreenshots(files: File[]): Promise<string> {
  const { ollamaUrl, model } = getState().profile;
  const images = await Promise.all(
    files.map(
      (f) =>
        new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result).split(",")[1]!);
          r.onerror = () => rej(r.error);
          r.readAsDataURL(f);
        }),
    ),
  );
  const out: string[] = [];
  for (const img of images) {
    const r = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        options: { temperature: 0 },
        messages: [
          {
            role: "user",
            content:
              "This is a screenshot of a chat app. Write out every message, top to bottom, one per line, as `Name: message`. Use the sender name shown in the screenshot; for messages sent by the phone's owner (usually on the right), use `Me`. Copy the text exactly, in whatever language it is in. Output only the lines.",
            images: [img],
          },
        ],
      }),
    });
    if (!r.ok) throw new Error(`Couldn't read the screenshot (${r.status})`);
    const j = (await r.json()) as { message: { content: string } };
    out.push(j.message.content.trim());
  }
  return out.join("\n");
}
