// Read-aloud. In English, the lessons, onboarding, verdicts and coach steps have narration
// recorded with ElevenLabs and bundled in the app (public/audio, indexed by audio/manifest.json,
// built by scripts/narrate.ts), so it plays offline in a warm human voice. Anything else, like
// what Ward noticed in a chat, and all of Urdu for now, uses the device's own voice through the
// Web Speech API (Android ships Urdu and English voices).

import type { Lang } from "./store.ts";

let manifest: Promise<Record<string, string>> | null = null;
let playing: HTMLAudioElement | null = null;

/** The same key scripts/narrate.ts uses: language + text, hashed. */
export async function clipKey(lang: Lang, text: string) {
  const h = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(`${lang}|${text.trim()}`));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function loadManifest() {
  manifest ??= fetch(new URL("./audio/manifest.json", document.baseURI))
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifest;
}

function deviceVoice(lang: Lang) {
  const want = lang === "ur" ? /^ur/i : /^en/i;
  return speechSynthesis.getVoices().find((v) => want.test(v.lang)) ?? null;
}

export function canSpeak(lang: Lang) {
  return typeof speechSynthesis !== "undefined" && (lang === "en" || !!deviceVoice(lang));
}

export function stopSpeaking() {
  playing?.pause();
  playing = null;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

/** Speak `text`. Resolves when it finishes (or is stopped). */
export async function speak(text: string, lang: Lang): Promise<void> {
  stopSpeaking();
  const file = (await loadManifest())[await clipKey(lang, text)];
  if (file) {
    const a = new Audio(new URL(`./audio/${file}`, document.baseURI).href);
    playing = a;
    await new Promise<void>((res) => {
      a.onended = a.onerror = a.onpause = () => res();
      void a.play().catch(() => res());
    });
    return;
  }
  if (typeof speechSynthesis === "undefined") return;
  const u = new SpeechSynthesisUtterance(text);
  const v = deviceVoice(lang);
  if (v) u.voice = v;
  u.lang = lang === "ur" ? "ur-PK" : "en";
  u.rate = 0.95;
  await new Promise<void>((res) => {
    u.onend = u.onerror = () => res();
    speechSynthesis.speak(u);
  });
}
