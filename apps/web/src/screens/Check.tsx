// Check a chat: bring it in (WhatsApp export, paste, or screenshots), say which person is you,
// and Ward reads it on the device.

import { useState } from "react";
import { CaretDown, ClipboardText, ImageSquare, Sparkle, UserCircle, UsersThree } from "@phosphor-icons/react";
import type { Chat } from "@ward/engine";
import sample from "../../../../packages/engine/fixtures/pileon-roman-urdu.txt?raw";
import { Ghost } from "../components/Ghost.tsx";
import { HaloDrop } from "../components/HaloDrop.tsx";
import { Button, Screen } from "../components/ui.tsx";
import { parse, readChatFile, readScreenshots, startCheck } from "../lib/run.ts";
import { useStore } from "../lib/store.ts";

type Stage = { at: "input" } | { at: "who"; chat: Chat; title: string };

export function Check() {
  const name = useStore((s) => s.profile.name);
  const [stage, setStage] = useState<Stage>({ at: "input" });
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [howOpen, setHowOpen] = useState(false);

  async function take(text: string, title: string) {
    setError(null);
    const chat = parse(text);
    if (chat.messages.length < 2) {
      setError("I couldn't find a conversation in that. Try exporting the chat again, or paste a few messages.");
      return;
    }
    setStage({ at: "who", chat, title });
  }

  async function onFiles(files: File[]) {
    setError(null);
    try {
      if (files.every((f) => f.type.startsWith("image/"))) {
        setBusy("Reading your screenshots");
        const text = await readScreenshots(files);
        setBusy(null);
        return take(text, "Screenshots");
      }
      const { text, title } = await readChatFile(files[0]!);
      return take(text, title);
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Something went wrong reading that file.");
    }
  }

  if (stage.at === "who") return <WhoAreYou chat={stage.chat} title={stage.title} myName={name} onBack={() => setStage({ at: "input" })} />;

  return (
    <Screen>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Check a chat</h1>
      <p className="mt-2 max-w-[48ch] text-dim">Show me a conversation and I'll tell you what I see. I read it right here. It never leaves this device.</p>

      <div className="mt-6">
        {busy ? (
          <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface px-6 py-12 text-center">
            <Ghost mood="think" size={84} />
            <p className="font-display text-lg font-semibold">{busy}…</p>
          </div>
        ) : (
          <HaloDrop accept=".txt,.zip,image/*" multiple onFiles={onFiles}>
            <span className="font-display text-xl font-semibold">Drop a WhatsApp export or screenshots</span>
            <span className="text-sm text-dim">Or tap to choose a file (.txt, .zip, or images)</span>
          </HaloDrop>
        )}
      </div>

      <div className="mt-3">
        <button onClick={() => setHowOpen((o) => !o)} aria-expanded={howOpen} className="flex min-h-11 items-center gap-2 text-sm font-bold text-glow">
          How do I export a WhatsApp chat?
          <CaretDown size={16} weight="bold" className={`transition-transform ${howOpen ? "rotate-180" : ""}`} />
        </button>
        {howOpen && (
          <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-dim marker:font-bold marker:text-glow">
            <li>Open the chat in WhatsApp.</li>
            <li>
              Android: tap <b className="text-ink">⋮</b>, then <b className="text-ink">More</b>, then <b className="text-ink">Export chat</b>. iPhone: tap the name at the top, then <b className="text-ink">Export chat</b>.
            </li>
            <li>
              Choose <b className="text-ink">Without media</b>, and share it to Ward (or save it and drop it here).
            </li>
          </ol>
        )}
      </div>

      <div className="mt-8">
        <label htmlFor="paste" className="flex items-center gap-2 font-display text-lg font-semibold">
          <ClipboardText size={22} weight="bold" className="text-glow" /> Or paste messages
        </label>
        <textarea
          id="paste"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={6}
          placeholder={"Hamza: lol did you see her photo\nBilal: so fat haha\nMe: please stop"}
          className="mt-2 w-full resize-y rounded-card border border-line bg-surface p-4 text-[1rem] leading-relaxed text-ink placeholder:text-dim/70 focus:border-glow focus:outline-none"
        />
        <p className="mt-1.5 text-sm text-dim">One message per line. "Name: message" helps me tell people apart.</p>
        <Button className="mt-3" disabled={!paste.trim()} onClick={() => take(paste, "Pasted chat")}>
          Check this
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-card bg-alarm-soft p-4 font-semibold text-alarm">
          {error}
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <span className="flex items-center gap-2 text-dim">
          <ImageSquare size={20} /> Just looking around?
        </span>
        <Button tone="quiet" onClick={() => take(sample, "8B Science (example)")}>
          <Sparkle size={18} weight="bold" /> Try an example chat
        </Button>
      </div>
    </Screen>
  );
}

function WhoAreYou({ chat, title, myName, onBack }: { chat: Chat; title: string; myName: string; onBack: () => void }) {
  const guess = chat.participants.find((p) => myName && p.toLowerCase().startsWith(myName.toLowerCase().split(" ")[0]!)) ?? null;
  const [self, setSelf] = useState<string | null>(guess);
  const [starting, setStarting] = useState(false);
  const counts = new Map<string, number>();
  for (const m of chat.messages) counts.set(m.sender, (counts.get(m.sender) ?? 0) + 1);

  return (
    <Screen>
      <div className="mb-2">
        <button onClick={onBack} className="text-sm font-bold text-dim hover:text-ink">
          ← Choose a different chat
        </button>
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Which one is you?</h1>
      <p className="mt-2 text-dim">
        {chat.messages.length} messages in <b className="text-ink">{title}</b>. So I know who's being talked to.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {chat.participants.slice(0, 24).map((p) => (
          <button
            key={p}
            onClick={() => setSelf(p)}
            aria-pressed={self === p}
            className={`flex min-h-14 items-center gap-3 rounded-btn border px-4 text-left transition-colors ${self === p ? "border-glow bg-glow-soft" : "border-line bg-surface hover:border-dim/40"}`}
          >
            <UserCircle size={26} weight={self === p ? "fill" : "regular"} className={self === p ? "text-glow" : "text-dim"} />
            <span className="min-w-0 flex-1 truncate font-semibold">{p}</span>
            <span className="text-sm text-dim">{counts.get(p) ?? 0}</span>
          </button>
        ))}
        <button
          onClick={() => setSelf(null)}
          aria-pressed={self === null}
          className={`flex min-h-14 items-center gap-3 rounded-btn border px-4 text-left transition-colors sm:col-span-2 ${self === null ? "border-glow bg-glow-soft" : "border-line bg-surface hover:border-dim/40"}`}
        >
          <UsersThree size={26} className={self === null ? "text-glow" : "text-dim"} />
          <span className="font-semibold">I'm checking it for a friend</span>
        </button>
      </div>
      <Button
        className="mt-8 w-full sm:w-auto"
        disabled={starting}
        onClick={async () => {
          setStarting(true);
          await startCheck(chat, self, title);
        }}
      >
        Read it, Ward
      </Button>
    </Screen>
  );
}
