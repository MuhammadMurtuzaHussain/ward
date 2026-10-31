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
  /** The language for the short "why" notes the child reads, e.g. "Urdu, in Urdu script". */
  language?: string;
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
- hostile: is it meant to hurt, mock, shame, threaten, exclude, pressure, or expose someone? Friends teasing each other in a friendly way is NOT hostile. Standing up for someone is NOT hostile. Talking about a bully is NOT hostile. Someone telling what was said or done to them, quoting the hurtful words to ask for help ("he told me to kill myself, what do I do?", "usne mujhe kaha mar ja"), is NOT hostile. But a hurtful message aimed at someone here stays hostile even when it starts with "someone said" or sits in quotation marks.
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
  private system: string;

  constructor(opts: GemmaJudgeOptions = {}) {
    const { transport, name, authority, language, ...rest } = opts;
    this.o = { baseUrl: DEFAULT_URL, model: "gemma4:e4b", batch: 20, context: 5, fetch: globalThis.fetch.bind(globalThis), ...rest };
    this.name = name ?? this.o.model;
    this.transport = transport;
    this.authority = authority ?? "full";
    this.system = language && !/^english/i.test(language) ? `${SYSTEM}\nWrite every "why" in ${language}, simply, the way a child would understand. Keep names as written.` : SYSTEM;
  }

  async judge(chat: Chat, { self, onProgress }: { self: string | null; onProgress?: (d: number, t: number) => void }) {
    const out = new Map<number, ModelJudgement>();
    const text = chat.messages.filter((m) => !m.media && m.text.trim());
    for (let i = 0; i < text.length; i += this.o.batch) {
      const batch = text.slice(i, i + this.o.batch);
      await this.judgeBatch(chat, self, batch, out);
      // Models sometimes skip entries in a long list. A skipped message isn't "not hurtful", it's
      // unread: ask once more for just those, in small groups.
      const missed = batch.filter((m) => !out.has(m.id));
      for (let k = 0; k < missed.length; k += 5) await this.judgeBatch(chat, self, missed.slice(k, k + 5), out);
      onProgress?.(Math.min(i + this.o.batch, text.length), text.length);
    }
    return out;
  }

  private async judgeBatch(chat: Chat, self: string | null, batch: Chat["messages"], out: Map<number, ModelJudgement>) {
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
  }

  private async chat(prompt: string): Promise<{ id: number; hostile: boolean; severity: number; categories?: string[]; target?: string | null; why?: string }[]> {
    if (this.transport) return parseMessages(await this.transport(this.system, prompt, SCHEMA));
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
          { role: "system", content: this.system },
          { role: "user", content: prompt },
        ],
      }),
    });
  }
}

export const JSON_INSTRUCTION = `Reply with only a JSON object, no other text: {"messages": [...]}, with one entry for EVERY message marked JUDGE, in order. Each entry has: "id" (the number after #), "hostile" (true or false), "severity" (0, 1, 2 or 3), "categories" (a list, possibly empty), "target" (a name or null), and "why" (a short reason).`;

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

/** A Transport to Ollama's chat API, for anything that takes one (e.g. GemmaSecondLook). */
export function ollamaTransport(model: string, baseUrl = DEFAULT_URL, f: typeof fetch = globalThis.fetch.bind(globalThis)): Transport {
  const post = (system: string, user: string, format?: object) =>
    f(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        ...(format ? { format } : {}),
        options: { temperature: 0, num_ctx: 4096 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  return async (system, user, schema) => {
    let r = await post(system, user, schema);
    // Some model builds (gemma4:e2b in Ollama) can't constrain output; ask for the JSON in words.
    if (r.status === 501) r = await post(system, `${user}\n\nReply with only this JSON shape, no other text: ${JSON.stringify(schema)}`);
    if (!r.ok) throw new Error(`Ollama ${model}: ${r.status} ${await r.text()}`);
    return ((await r.json()) as { message: { content: string } }).message.content;
  };
}

const LOOK_SCHEMA = {
  type: "object",
  properties: { hostile: { type: "boolean" }, why: { type: "string" } },
  required: ["hostile", "why"],
};

export const SECOND_LOOK_SYSTEM = `A small model flagged one chat message as possibly hurtful. It reads messages one at a time and often mistakes ordinary chat for threats. You can see the messages around it.
Messages may be in English, Roman Urdu, Hinglish, Bangla, or a mix. Read them as a native speaker would.

Decide whether the message marked CHECK is meant to hurt, mock, shame, threaten, exclude, pressure or expose someone in this chat.
NOT hostile: plans, goodbyes and everyday chat; friends teasing each other when both are clearly joking; game trash talk that isn't aimed at hurting anyone; standing up for someone; someone quoting what was said to them, to ask for help.
Hostile even if phrased politely, sweetly or as a joke: threats; telling someone to hurt themselves; pressure for photos; threats to share private things; shutting a named person out on purpose (a new group, a plan or a game "without X", "don't add X"); backhanded compliments about someone's body, looks, family or background ("pretty for your size"); sarcasm or "energy" jokes that mock a person.
If it could really be a threat to someone's safety and you can't tell, answer hostile.
Reply as JSON: "hostile" (true or false) and "why" (under 15 words, plain English a 10-year-old understands; never guess anyone's gender).`;

/** Models measured to clear Ward Lite's false alarms without clearing real abuse (eval/secondlook). */
export const CAN_CLEAR = ["gemma4:e4b"];

/**
 * Gemma's second look at messages only Ward Lite flagged: one message at a time, with up to six
 * messages before it and two after. Small Gemma models judge a long list poorly but answer one
 * focused question well, and this is the question Ward Lite can't answer: what's around it.
 */
export class GemmaSecondLook {
  private transport: Transport;
  readonly name: string;
  readonly canClear: boolean;
  private around: { before: number; after: number };

  /** canClear: see SecondLook. True only for a model that passed eval/secondlook (Gemma 4 E4B). */
  constructor(transport: Transport, name: string, canClear: boolean, around = { before: 6, after: 2 }) {
    this.transport = transport;
    this.name = name;
    this.canClear = canClear;
    this.around = around;
  }

  async review(chat: Chat, ids: number[], self: string | null) {
    const out = new Map<number, { hostile: boolean; why?: string }>();
    for (const id of ids) {
      const at = chat.messages.findIndex((m) => m.id === id);
      if (at < 0) continue;
      const near = chat.messages.slice(Math.max(0, at - this.around.before), at + 1 + this.around.after);
      const prompt = [
        `Participants: ${chat.participants.join(", ")}.${self ? ` The child using this app is "${self}".` : ""}`,
        "",
        ...near.map((m) => `${m.id === id ? ">>> CHECK" : "context"} ${m.sender}: ${m.media ? "<photo or video>" : m.text}`),
      ].join("\n");
      try {
        const text = await this.transport(SECOND_LOOK_SYSTEM, prompt, LOOK_SCHEMA);
        const j = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as { hostile?: unknown; why?: unknown };
        if (typeof j.hostile === "boolean") out.set(id, { hostile: j.hostile, why: typeof j.why === "string" ? j.why : undefined });
      } catch {
        // No answer is no verdict: the context rules decide instead.
      }
    }
    return out;
  }
}
