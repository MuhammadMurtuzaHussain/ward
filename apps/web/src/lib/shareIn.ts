// Share to Ward (Android): WhatsApp's "Export chat" and the gallery hand files to Ward through
// the ShareIn plugin in mobile/android. They arrive as File objects, exactly like a dropped file,
// and wait in memory for the Check screen to pick them up.

import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { setState, tab } from "./store.ts";

interface Shared {
  files: { name: string; mime: string; data: string }[];
  text?: string;
  subject?: string;
}

const ShareIn = registerPlugin<{
  take(): Promise<Shared>;
  addListener(event: "shared", fn: () => void): Promise<PluginListenerHandle>;
}>("ShareIn");

export interface Incoming {
  files: File[];
  text?: string;
  title?: string;
}

function toFile(f: Shared["files"][number]): File {
  const bin = atob(f.data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], f.name, { type: f.mime });
}

async function pull() {
  const s = await ShareIn.take();
  if (!s.files.length && !s.text) return;
  const incoming: Incoming = {
    files: s.files.map(toFile),
    text: s.files.length ? undefined : s.text,
    // WhatsApp's subject line is "WhatsApp Chat with <name>".
    title: s.subject?.replace(/^WhatsApp Chat (with|-) /i, "").trim(),
  };
  setState((st) => ({ ...st, incoming }));
  tab({ name: "check" });
}

export function listenForShares() {
  if (!Capacitor.isNativePlatform()) return;
  void pull();
  void ShareIn.addListener("shared", () => void pull());
}
