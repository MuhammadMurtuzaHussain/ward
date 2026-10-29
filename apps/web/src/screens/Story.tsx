// The story player: a chat that happens to you. Lines arrive one at a time like a real group
// chat, then you choose. Every path ends with what that choice did and what else could work, and
// you can go back and choose differently. Full screen, like a lesson.

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, ChatsCircle, Lightning, X } from "@phosphor-icons/react";
import { storyById, type StoryLine } from "@ward/lessons";
import { Ghost, type Mood } from "../components/Ghost.tsx";
import { Speak } from "../components/Speak.tsx";
import { Button } from "../components/ui.tsx";
import { back, finishStory, useStore } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

type Shown = { kind: "line"; line: StoryLine } | { kind: "choice"; text: string };
const MOOD: Record<"kind" | "mixed" | "hard", Mood> = { kind: "cheer", mixed: "think", hard: "calm" };

export function StoryPlayer({ id }: { id: string }) {
  const lang = useStore((s) => s.profile.lang);
  const ends = useStore((s) => s.profile.storyEnds);
  const t = useT();
  const reduce = useReducedMotion();
  const story = storyById(id, lang);
  const [sceneId, setSceneId] = useState(story?.start ?? "");
  const [shown, setShown] = useState<Shown[]>([]);
  const [typing, setTyping] = useState(true);
  const [earned, setEarned] = useState<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const scene = story?.scenes[sceneId];

  // Reveal the scene's lines one by one.
  useEffect(() => {
    if (!scene) return;
    setTyping(true);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (i >= scene.lines.length) {
        setTyping(false);
        return;
      }
      const line = scene.lines[i++]!;
      setShown((s) => [...s, { kind: "line", line }]);
      timer = setTimeout(step, reduce ? 0 : Math.min(1400, 450 + line.text.length * 14));
    };
    timer = setTimeout(step, reduce ? 0 : 300);
    return () => clearTimeout(timer);
  }, [sceneId, story?.id]);

  // The first ending of a story earns XP, once.
  const counted = useRef<string | null>(null);
  useEffect(() => {
    if (!story || !scene?.end || typing || counted.current === sceneId) return;
    counted.current = sceneId;
    const first = !ends.some((k) => k.startsWith(`${story.id}:`));
    finishStory(story.id, sceneId);
    setEarned(first ? 10 : null);
  }, [typing, sceneId]);

  // Braces matter: newer browsers return a Promise from scrollIntoView, and React would take it
  // for a cleanup function.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [shown.length, typing]);

  if (!story || !scene)
    return (
      <main className="grid min-h-[100dvh] place-items-center p-6">
        <Button onClick={() => back({ name: "path" })}>{t.story.done}</Button>
      </main>
    );

  const totalEnds = Object.values(story.scenes).filter((x) => x.end).length;
  const found = new Set([...ends.filter((k) => k.startsWith(`${story.id}:`)), ...(scene.end && !typing ? [`${story.id}:${sceneId}`] : [])]).size;

  function restart() {
    setTyping(true);
    setShown([]);
    setEarned(null);
    counted.current = null;
    setSceneId(story!.start);
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <button onClick={() => back({ name: "path" })} aria-label={t.story.close} className="grid size-11 place-items-center rounded-full text-dim hover:bg-raised">
          <X size={22} weight="bold" />
        </button>
        <span className="grid size-10 place-items-center rounded-full bg-glow-soft text-glow" aria-hidden>
          <ChatsCircle size={22} weight="bold" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display font-bold" dir="auto">{story.place}</p>
          <p className="truncate text-xs text-dim">
            {t.story.label} · {story.title}
          </p>
        </div>
      </header>

      <ol className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-6" aria-live="polite">
        {shown.map((x, i) => (
          <motion.li key={i} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            <Line item={x} />
          </motion.li>
        ))}
        {typing && !reduce && (
          <li aria-hidden className="flex gap-1 ps-2">
            {[0, 1, 2].map((d) => (
              <motion.span key={d} className="size-2 rounded-full bg-dim/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />
            ))}
          </li>
        )}
      </ol>

      {!typing && scene.choices && (
        <div className="sticky bottom-0 z-20 border-t border-line bg-bg/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur">
          <p className="mb-3 text-sm font-bold text-glow">{t.story.choose}</p>
          <div className="grid gap-2">
            {scene.choices.map((c) => (
              <button
                key={c.next}
                onClick={() => {
                  // Typing starts in the same update as the scene change, so an ending never
                  // shows (or counts) before its lines have arrived.
                  setTyping(true);
                  setShown((s) => [...s, { kind: "choice", text: c.text }]);
                  setSceneId(c.next);
                }}
                className="min-h-14 rounded-card border-2 border-line bg-surface px-4 py-3 text-start font-semibold transition-colors hover:border-glow active:scale-[0.99]"
              >
                {c.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {!typing && scene.end && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mx-4 mb-[calc(env(safe-area-inset-bottom)+1.5rem)] rounded-card border p-6 ${scene.end.tone === "hard" ? "border-line bg-surface" : "border-glow/40 bg-glow-soft"}`}
        >
          <div className="flex items-start gap-4">
            <Ghost mood={MOOD[scene.end.tone]} size={72} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-glow">{t.story.tone[scene.end.tone]}</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{scene.end.title}</h2>
            </div>
          </div>
          <p className="mt-4 leading-relaxed">{scene.end.body}</p>
          <Speak text={[scene.end.title, scene.end.body]} className="mt-3" />
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-dim">
            <span>{t.story.endings(found, totalEnds)}</span>
            {earned && (
              <span dir="ltr" className="inline-flex items-center gap-1 font-bold text-glow">
                <Lightning size={14} weight="fill" /> {t.story.xp(earned)}
              </span>
            )}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button tone="quiet" onClick={restart}>
              <ArrowCounterClockwise size={18} weight="bold" /> {t.story.again}
            </Button>
            <Button onClick={() => back({ name: "path" })}>{t.story.done}</Button>
          </div>
        </motion.section>
      )}
      <div ref={bottom} />
    </main>
  );
}

function Line({ item }: { item: Shown }) {
  const t = useT();
  if (item.kind === "choice")
    return (
      <p className="mx-auto max-w-[90%] rounded-full bg-raised px-4 py-1.5 text-center text-sm text-dim">
        {t.story.youChose}: <span className="font-semibold text-ink">{item.text}</span>
      </p>
    );
  const l = item.line;
  if (!l.from && !l.me) return <p className="mx-auto max-w-[46ch] px-2 text-center leading-relaxed text-dim">{l.text}</p>;
  return (
    <div className={`flex flex-col ${l.me ? "items-end" : "items-start"}`}>
      <div className={`max-w-[85%] rounded-[calc(var(--r-card)-6px)] px-4 py-2.5 ${l.me ? "bg-glow text-glow-ink" : "bg-surface"}`}>
        {!l.me && (
          <span className="block text-xs font-bold text-glow" dir="auto">
            {l.from}
          </span>
        )}
        <span dir="auto" className="whitespace-pre-wrap break-words">
          {l.text}
        </span>
      </div>
    </div>
  );
}
