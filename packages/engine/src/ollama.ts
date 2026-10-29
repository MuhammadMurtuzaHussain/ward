// Model judges that talk to Ollama on this machine. Nothing leaves the device: the base URL is
// localhost (or the child's own Ward desktop on home Wi-Fi, when a phone is paired with it).
//
// GemmaJudge reads a stretch of the chat at once, so it sees context: who is answering whom,
// whether "pagal" is a friend laughing or a pile-on, and code-mixed Roman Urdu or Hinglish.
// ShieldGemmaJudge asks Google's safety classifier one yes/no question per message.

import type { Judge } from "./analyze.ts";
import { CATEGORIES, type Category, type Chat, type Message, type ModelJudgement, type Severity } from "./types.ts";

export interface OllamaOptions {
  baseUrl?: string;
  model?: string;
  /** Messages per request. Smaller is faster to first result; larger gives more context. */
  batch?: number;
  /** Earlier messages shown before each batch, as context only. */
  context?: number;
  fetch?: typeof fetch;
  signal?: AbortSignal;
}

/** Sends one system + user prompt with a JSON schema and returns the model's raw reply. */
export type Transport = (system: string, user: string, schema: object) => Promise<string>;

export interface GemmaJudgeOptions extends OllamaOptions {
  /** Run somewhere other than Ollama, e.g. LiteRT-LM on the phone. */
  transport?: Transport;
  /** Shown in "how Ward knows". Defaults to the model name. */
  name?: string;
  authority?: ModelJudgement["authority"];
}

const DEFAULT_URL = "http://127.0.0.1:11434";

export async function ollamaModels(baseUrl = DEFAULT_URL, f: typeof fetch = fetch): Promise<string[]> {
  try {
    const r = await f(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
    if (!r.ok) return [];
    const j = (await r.json()) as { models?: { name: string }[] };
    return (j.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

const SCHEMA = {
  type: "object",
  properties: {
    messages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          hostile: { type: "boolean" },
          severity: { type: "integer", enum: [0, 1, 2, 3] },
          categories: { type: "array", items: { type: "string", enum: CATEGORIES } },
          target: { type: ["string", "null"] },
          why: { type: "string" },
        },
        required: ["id", "hostile", "severity", "categories", "target", "why"],
      },
    },
  },
  required: ["messages"],
};

const SYSTEM = `You help a child understand whether they are being bullied in a chat they shared with you.
You will see a stretch of a chat. Judge ONLY the messages marked JUDGE; the others are context.
Messages may be in English, Roman Urdu, Hinglish, Bangla, or a mix. Read them as a native speaker would.

For each JUDGE message decide:
- hostile: is it meant to hurt, mock, shame, threaten, exclude, pressure, or expose someone? Friends teasing each other in a friendly way is NOT hostile. Standing up for someone is NOT hostile. Talking about a bully is NOT hostile.
- severity: 0 not hostile; 1 rude or unkind; 2 bullying (degrading, insulting appearance or identity, excluding, humiliating, repeated); 3 dangerous (threats of violence, telling someone to hurt or kill themselves, sexual messages or pressure for photos, threats to share photos or private information, blackmail).
- categories: any of ${CATEGORIES.join(", ")}.
- target: the name of the person it is aimed at, exactly as they appear in the chat, or null.
- why: under 15 words, plain English a 10-year-old understands. Refer to people by name or as "they"; never guess anyone's gender. Example: "Calls Ayesha a buffalo to mock their weight."
Return every JUDGE message, in order.`;

function line(m: Message, judge: boolean) {
  const time = m.at ? m.at.toISOString().slice(0, 16).replace("T", " ") + " " : "";
  return `${judge ? "JUDGE" : "context"} #${m.id} ${time}${m.sender}: ${m.media ? "<photo or video>" : m.text}`;
}

function clampSeverity(n: unknown): Severity {
  const v = Math.round(Number(n));
  return (v >= 0 && v <= 3 ? v : 0) as Severity;
}

export class GemmaJudge implements Judge {
  readonly name: string;
  private o: Required<Omit<OllamaOptions, "signal">> & { signal?: AbortSignal };
  private transport?: Transport;
  private authority: ModelJudgement["authority"];

  constructor(opts: GemmaJudgeOptions = {}) {
    const { transport, name, authority, ...rest } = opts;
    this.o = { baseUrl: DEFAULT_URL, model: "gemma4:e4b", batch: 20, context: 5, fetch: globalThis.fetch.bind(globalThis), ...rest };
    this.name = name ?? this.o.model;
    this.transport = transport;
    this.authority = authority ?? "full";
  }

  async judge(chat: Chat, { self, onProgress }: { self: string | null; onProgress?: (d: number, t: number) => void }) {
    const out = new Map<number, ModelJudgement>();
    const text = chat.messages.filter((m) => !m.media && m.text.trim());
    for (let i = 0; i < text.length; i += this.o.batch) {
      const batch = text.slice(i, i + this.o.batch);
      const ctx = chat.messages.slice(Math.max(0, batch[0]!.id - this.o.context), batch[0]!.id);
      const prompt = [
        `Participants: ${chat.participants.join(", ")}.${self ? ` The child using this app is "${self}".` : ""}`,
        "",
        ...ctx.map((m) => line(m, false)),
        ...batch.map((m) => line(m, true)),
      ].join("\n");
      const res = await this.chat(prompt);
      for (const r of res) {
        if (!batch.some((m) => m.id === r.id)) continue;
        out.set(r.id, {
          hostile: Boolean(r.hostile) && clampSeverity(r.severity) > 0,
          severity: r.hostile ? clampSeverity(r.severity) : 0,
          categories: (r.categories ?? []).filter((c): c is Category => (CATEGORIES as readonly string[]).includes(c)),
          target: r.target ?? undefined,
          why: r.why,
          model: this.name,
          authority: this.authority,
        });
      }
      onProgress?.(Math.min(i + this.o.batch, text.length), text.length);
    }
    return out;
  }

  private async chat(prompt: string): Promise<{ id: number; hostile: boolean; severity: number; categories?: string[]; target?: string | null; why?: string }[]> {
    if (this.transport) return parseMessages(await this.transport(SYSTEM, prompt, SCHEMA));
    let r = await this.post(prompt, true);
    // Some model builds can't constrain output to a schema; ask for the JSON in words instead.
    if (r.status === 501) r = await this.post(`${prompt}\n\n${JSON_INSTRUCTION}`, false);
    if (!r.ok) throw new Error(`Ollama ${this.o.model}: ${r.status} ${await r.text()}`);
    const j = (await r.json()) as { message: { content: string } };
    return parseMessages(j.message.content);
  }

  private post(prompt: string, structured: boolean) {
    return this.o.fetch(`${this.o.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: this.o.signal,
      body: JSON.stringify({
        model: this.o.model,
        stream: false,
        think: false,
        ...(structured ? { format: SCHEMA } : {}),
        options: { temperature: 0, num_ctx: 8192 },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    });
  }
}

export const JSON_INSTRUCTION = `Answer with only JSON, no other text, in exactly this shape:
{"messages":[{"id":0,"hostile":false,"severity":0,"categories":[],"target":null,"why":""}]}`;

/** Constrained decoding usually gives clean JSON; be forgiving when a runtime wraps it in prose or fences. */
function parseMessages(text: string): never[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  try {
    return (JSON.parse(text.slice(start, end + 1)) as { messages?: never[] }).messages ?? [];
  } catch {
    return [];
  }
}

/** ShieldGemma's own prompt template, with the harassment policy from its model card. */
function shieldPrompt(text: string) {
  return `You are a policy expert trying to help determine whether a user prompt is in violation of the defined safety policies.

<start_of_turn>
Human Question: ${text.trim()}
<end_of_turn>

Our safety principle is defined in the below:

* "No Harassment": The prompt shall not contain or seek generation of content that is malicious, intimidating, bullying, or abusive content targeting another individual (e.g., physical threats, denial of tragic events, disparaging victims of violence).

Does the human question violate the above principle? Your answer must start with 'Yes' or 'No'. And then walk through step by step to be sure we answer correctly.
`;
}

export class ShieldGemmaJudge implements Judge {
  readonly name: string;
  private o: Required<Omit<OllamaOptions, "signal" | "batch" | "context">> & { signal?: AbortSignal };

  constructor(opts: Omit<OllamaOptions, "batch"> = {}) {
    this.o = { baseUrl: DEFAULT_URL, model: "shieldgemma:2b", fetch: globalThis.fetch.bind(globalThis), ...opts };
    this.name = this.o.model;
  }

  /** Probability-ish: 1 for Yes, 0 for No. Exposed for the eval. */
  async violates(text: string): Promise<boolean> {
    const r = await this.o.fetch(`${this.o.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: this.o.signal,
      body: JSON.stringify({ model: this.o.model, prompt: shieldPrompt(text), raw: true, stream: false, options: { temperature: 0, num_predict: 2 } }),
    });
    if (!r.ok) throw new Error(`Ollama ${this.o.model}: ${r.status} ${await r.text()}`);
    const j = (await r.json()) as { response: string };
    return /^\s*yes/i.test(j.response);
  }

  async judge(chat: Chat, { onProgress }: { self: string | null; onProgress?: (d: number, t: number) => void }) {
    const out = new Map<number, ModelJudgement>();
    const text = chat.messages.filter((m) => !m.media && m.text.trim());
    let done = 0;
    for (const m of text) {
      const bad = await this.violates(m.text);
      out.set(m.id, { hostile: bad, severity: bad ? 2 : 0, categories: [], model: this.name, why: bad ? "ShieldGemma flags this as harassment." : undefined });
      onProgress?.(++done, text.length);
    }
    return out;
  }
}
