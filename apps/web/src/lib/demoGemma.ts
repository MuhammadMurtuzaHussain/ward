// The web demo only: Gemma on a demo server, so visitors can see a close read without installing
// anything. Off unless the build sets VITE_GEMMA_DEMO_URL (the Render demo does), and used only
// when the visitor asks. It sends the chat to that server, so the page says so first; real
// installs of Ward never use it and read on the device.

import { JSON_INSTRUCTION, type Transport } from "@ward/engine";

export const DEMO_GEMMA_URL: string | undefined = import.meta.env.VITE_GEMMA_DEMO_URL || undefined;
export const DEMO_GEMMA = "Gemma 4 (Google AI Studio, via Ward's demo server)";

export const demoTransport: Transport = async (system, user) => {
  const r = await fetch(DEMO_GEMMA_URL!, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system, user: `${user}\n\n${JSON_INSTRUCTION}` }),
  });
  const j = (await r.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!r.ok || typeof j.text !== "string") throw new Error(j.error ?? `demo server: ${r.status}`);
  return j.text;
};
