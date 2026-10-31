// A message the child can send to a trusted adult, written from what Ward found. Gemma writes it
// in a child's voice when it's available; otherwise a plain template does the same job. The
// message never quotes the slurs: it says what kind of thing is happening, for how long.

import type { Analysis } from "@ward/engine";
import { getState } from "./store.ts";
import { phoneWrite } from "./phoneGemma.ts";
import { desktopWrite } from "./desktopGemma.ts";
import { t } from "../i18n/index.ts";

export function templateDraft(a: Analysis, where: string, adult: string): string {
  const d = t().draft;
  const ur = getState().profile.lang === "ur";
  const kinds = a.patterns.map((p) => d.kinds[p.kind]).filter((k): k is string => !!k);
  const days = new Set(a.findings.filter((f) => f.severity > 0 && f.message.at).map((f) => f.message.at!.toDateString())).size;
  const since = days > 1 ? d.since(days) : "";
  const three = kinds.slice(0, 3);
  const and = ur ? " اور " : " and ";
  const joined = three.length > 1 ? `${three.slice(0, -1).join(ur ? "، " : ", ")}${and}${three.at(-1)}` : (three[0] ?? "");
  const place = where.replace(/\s*\(example\)$/, "");
  const sentence = ur ? `${joined}۔` : `${joined[0]?.toUpperCase() ?? ""}${joined.slice(1)}.`;
  return [d.open(d.hi(adult), place), joined ? `${sentence}${since}` : `${d.meanThere}${since}`, d.close].join(" ");
}

export async function gemmaDraft(a: Analysis, where: string, adult: string, age: string): Promise<string | null> {
  const { ollamaUrl, model } = getState().profile;
  const facts = [
    ...a.patterns.map((p) => `- ${p.summary}`),
    `- ${a.findings.filter((f) => f.severity > 0).length} hurtful messages`,
  ].join("\n");
  const content = `Write a short text message (3 or 4 sentences) from a child aged ${age === "8" ? "8 to 10" : age === "11" ? "11 to 13" : "14 to 17"} to ${adult || "a trusted adult"}, asking for help because they are being bullied in "${where}". Use simple, honest words a child that age would use. Do not quote any insults. Mention they saved the messages. Write it in ${t().draft.gemmaLanguage}. Facts:\n${facts}\nReply with only the message.`;
  const clean = (t: string | null) => t?.trim().replace(/^"|"$/g, "") || null;
  try {
    const r = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({ model, stream: false, think: false, options: { temperature: 0.4 }, messages: [{ role: "user", content }] }),
    });
    if (r.ok) return clean(((await r.json()) as { message: { content: string } }).message.content);
  } catch {
    // no Ollama: try the Gemma built into Ward for desktop, then the phone's
  }
  return clean((await desktopWrite(content, 0.4)) ?? (await phoneWrite(content)));
}
