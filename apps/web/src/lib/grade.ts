// Feedback on written answers. Gemma gives one warm, specific note; without a model, the child
// sees an example answer to compare with. Writing is never marked wrong.

import type { Exercise } from "@ward/lessons";
import { getState } from "./store.ts";
import { phoneWrite } from "./phoneGemma.ts";

export async function gradeWriting(ex: Extract<Exercise, { kind: "write" }>, text: string, age: string): Promise<string> {
  const fallback = `Good. Here's one way to say it: "${ex.example}"`;
  const { ollamaUrl, model } = getState().profile;
  const content = `You are Ward, a kind coach helping a child aged ${age === "8" ? "8 to 10" : age === "11" ? "11 to 13" : "14 to 17"} practise dealing with bullying.
Task they were given: ${ex.prompt}
A good answer: ${ex.goal}
Their answer: """${text.slice(0, 600)}"""
Give two short sentences of feedback in plain words: first what they did well, then one specific thing that would make it even stronger. If their answer is unkind or unsafe, gently say why and suggest a better way. No lists, no quotes around your reply.`;
  try {
    const r = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        options: { temperature: 0.3 },
        messages: [{ role: "user", content }],
      }),
    });
    if (r.ok) return ((await r.json()) as { message: { content: string } }).message.content.trim() || fallback;
  } catch {
    // no computer Gemma: try the phone's
  }
  return (await phoneWrite(content)) ?? fallback;
}
