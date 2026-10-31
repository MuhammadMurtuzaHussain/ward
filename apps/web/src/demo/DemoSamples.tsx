// One-tap sample chats for the hosted demo: straight to a verdict, no file and no "which one is you?".

import { ChatsCircle } from "@phosphor-icons/react";
import { parse, startCheck } from "../lib/run.ts";
import { useT } from "../i18n/index.ts";
import { SAMPLES } from "./samples.ts";

export function DemoSamples() {
  const t = useT();
  return (
    <section className="mt-6 rounded-card border border-line bg-surface p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <ChatsCircle size={22} weight="bold" className="text-glow" /> {t.demo.samplesTitle}
      </h2>
      <p className="mt-1 text-sm text-dim">{t.demo.samplesLine}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {SAMPLES.map((s) => {
          const [name, hint] = t.demo.samples[s.id];
          return (
            <button
              key={s.id}
              onClick={() => void startCheck(parse(s.text), s.self, s.title)}
              className="flex min-h-14 flex-col items-start justify-center rounded-btn border border-line bg-raised px-4 py-3 text-start transition-colors hover:border-glow"
            >
              <span className="font-display font-semibold">{name}</span>
              <span className="text-sm text-dim">{hint}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
