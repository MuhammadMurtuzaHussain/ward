// The web demo's Gemma: a narrow relay from the Ward demo site to Gemma on Google AI Studio, so
// judges and visitors can see a close read without installing anything. Real installs of Ward
// never use it: they read on the device. The key stays here (GEMMA_API_KEY), never in the page.
// It accepts only the demo site's origin, small bodies and a few requests per visitor, and it
// logs no text and stores nothing.

import type { IncomingMessage, ServerResponse } from "node:http";

const ORIGINS = (process.env.GEMMA_DEMO_ORIGINS ?? "https://ward-w8cd.onrender.com").split(",").map((s) => s.trim());
const API = "https://generativelanguage.googleapis.com/v1beta";
const MAX_BODY = 24_000;
const WINDOW_MS = 10 * 60_000;
const PER_WINDOW = 40;
const seen = new Map<string, number[]>();

let model: Promise<string> | null = null;

/** The newest instruction-tuned Gemma the key can use, unless GEMMA_MODEL names one. */
function pickModel(key: string): Promise<string> {
  model ??= (async () => {
    if (process.env.GEMMA_MODEL) return process.env.GEMMA_MODEL;
    const r = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
    const names = ((await r.json()) as { models?: { name: string }[] }).models?.map((m) => m.name.replace(/^models\//, "")) ?? [];
    const gemma = names.filter((n) => /^gemma-\d/.test(n) && /-it$/.test(n));
    const rank = (n: string) => {
      const [, ver, size] = /^gemma-([\d.]+)n?-?(?:e)?(\d+)?/.exec(n) ?? [];
      return Number(ver ?? 0) * 1000 + Math.min(Number(size ?? 0), 27);
    };
    const best = gemma.sort((a, b) => rank(b) - rank(a))[0] ?? "gemma-3-27b-it";
    console.log(new Date().toISOString(), `gemma demo: using ${best} (available: ${gemma.join(", ")})`);
    return best;
  })();
  model.catch(() => (model = null));
  return model;
}

function allowed(ip: string) {
  const now = Date.now();
  const hits = (seen.get(ip) ?? []).filter((t) => t > now - WINDOW_MS);
  if (hits.length >= PER_WINDOW) return false;
  hits.push(now);
  seen.set(ip, hits);
  if (seen.size > 5000) for (const [k, v] of seen) if (!v.some((t) => t > now - WINDOW_MS)) seen.delete(k);
  return true;
}

function send(res: ServerResponse, origin: string | undefined, status: number, body: unknown) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    ...(origin && ORIGINS.includes(origin) ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
  });
  res.end(JSON.stringify(body));
}

/** Handles /gemma. Returns false for any other path. */
export async function handleGemma(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!req.url?.startsWith("/gemma")) return false;
  const origin = req.headers.origin;
  const key = process.env.GEMMA_API_KEY;
  if (req.method === "OPTIONS") {
    res.writeHead(origin && ORIGINS.includes(origin) ? 204 : 403, {
      ...(origin && ORIGINS.includes(origin)
        ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type", "access-control-max-age": "600", vary: "Origin" }
        : {}),
    });
    res.end();
    return true;
  }
  if (req.method !== "POST" || !origin || !ORIGINS.includes(origin)) return void send(res, origin, 403, { error: "not allowed" }), true;
  if (!key) return void send(res, origin, 503, { error: "the demo Gemma isn't configured" }), true;
  const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",")[0]!.trim();
  if (!allowed(ip)) return void send(res, origin, 429, { error: "too many requests; try again in a few minutes" }), true;

  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) return void send(res, origin, 413, { error: "too long for the demo" }), true;
  }
  let prompt: string;
  try {
    const b = JSON.parse(raw) as { system?: unknown; user?: unknown };
    if (typeof b.user !== "string") throw new Error();
    // Gemma on the API takes no system instruction, so it leads the one user turn.
    prompt = `${typeof b.system === "string" ? `${b.system}\n\n` : ""}${b.user}`;
  } catch {
    return void send(res, origin, 400, { error: "bad request" }), true;
  }
  try {
    const m = await pickModel(key);
    const call = () =>
      fetch(`${API}/models/${m}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 4096 } }),
      });
    // AI Studio sometimes answers 5xx under load; one retry covers most of it.
    let r = await call();
    if (r.status >= 500) r = await call();
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[]; error?: { message?: string } };
    if (!r.ok) {
      console.log(new Date().toISOString(), `gemma demo: upstream ${r.status}`);
      return void send(res, origin, 502, { error: "Gemma didn't answer" }), true;
    }
    // Gemma 4 can return its thinking as separate parts; only the answer goes back.
    const parts = j.candidates?.[0]?.content?.parts ?? [];
    send(res, origin, 200, { text: parts.filter((p) => !p.thought).map((p) => p.text ?? "").join(""), model: m });
  } catch {
    send(res, origin, 502, { error: "Gemma didn't answer" });
  }
  return true;
}
