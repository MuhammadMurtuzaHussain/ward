// A message the child can send to a trusted adult, written from what Ward found. Gemma writes it
// in a child's voice when it's available; otherwise a plain template does the same job. The
// message never quotes the slurs: it says what kind of thing is happening, for how long.

import type { Analysis } from "@ward/engine";
import { getState } from "./store.ts";

const KIND_WORDS: Record<string, string> = {
  danger: "some messages threaten me",
  campaign: "the same person keeps going after me",
  pileon: "a group of people piled on me at once",
  ghosts: "new accounts were added just to send me mean messages",
  exclusion: "people are trying to keep me out",
  nightwatch: "a lot of it happens late at night",
  escalating: "it's getting worse",
};

export function templateDraft(a: Analysis, where: string, adult: string): string {
  const kinds = a.patterns.map((p) => KIND_WORDS[p.kind]).filter(Boolean);
  const days = new Set(a.findings.filter((f) => f.severity > 0 && f.message.at).map((f) => f.message.at!.toDateString())).size;
  const since = days > 1 ? ` It's been going on for ${days} days.` : "";
  const three = kinds.slice(0, 3);
  const joined = three.length > 1 ? `${three.slice(0, -1).join(", ")} and ${three.at(-1)}` : (three[0] ?? "");
  const place = where.replace(/\s*\(example\)$/, "");
  return [
    `${adult ? `Hi ${adult}, c` : "C"}an we talk soon? Something is happening in ${place} and I need help.`,
    joined ? `${joined[0]!.toUpperCase()}${joined.slice(1)}.${since}` : `People are being mean to me there.${since}`,
    "I've saved the messages so I can show you. Please don't be angry, I just want it to stop.",
  ].join(" ");
}

export async function gemmaDraft(a: Analysis, where: string, adult: string, age: string): Promise<string | null> {
  const { ollamaUrl, model } = getState().profile;
  const facts = [
    ...a.patterns.map((p) => `- ${p.summary}`),
    `- ${a.findings.filter((f) => f.severity > 0).length} hurtful messages`,
  ].join("\n");
  try {
    const r = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        options: { temperature: 0.4 },
        messages: [
          {
            role: "user",
            content: `Write a short text message (3 or 4 sentences) from a child aged ${age === "8" ? "8 to 10" : age === "11" ? "11 to 13" : "14 to 17"} to ${adult || "a trusted adult"}, asking for help because they are being bullied in "${where}". Use simple, honest words a child that age would use. Do not quote any insults. Mention they saved the messages. Facts:\n${facts}\nReply with only the message.`,
          },
        ],
      }),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { message: { content: string } };
    return j.message.content.trim().replace(/^"|"$/g, "") || null;
  } catch {
    return null;
  }
}
