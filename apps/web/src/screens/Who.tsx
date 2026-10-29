// "Who's using Ward?": shown on a phone with more than one profile, on a locked profile, and
// after a quick exit. It shows only names and colours; everything else waits behind the PIN.

import { useState } from "react";
import { LockSimple, Plus, UserCircle } from "@phosphor-icons/react";
import { Ghost } from "../components/Ghost.tsx";
import { PinPad } from "../components/PinPad.tsx";
import { LOOKS } from "../lib/looks.ts";
import { addProfile, openProfile, useStore, type ProfileEntry } from "../lib/store.ts";
import { useT } from "../i18n/index.ts";

export function Who() {
  const list = useStore((s) => s.profiles.list);
  const t = useT();
  const [asking, setAsking] = useState<ProfileEntry | null>(null);

  if (asking)
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6">
        <PinPad title={t.profiles.pinFor(asking.name || t.profiles.unnamed)} onDone={async (pin) => openProfile(asking.id, pin)} />
        <button onClick={() => setAsking(null)} className="mt-8 min-h-11 font-bold text-dim hover:text-ink">
          {t.common.back}
        </button>
      </main>
    );

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-6 py-12">
      <Ghost mood="calm" size={84} className="mx-auto" />
      <h1 className="mt-6 text-center font-display text-3xl font-bold tracking-tight">{t.profiles.who}</h1>
      <p className="mt-2 text-center text-dim">{t.profiles.whoLine}</p>
      <ul className="mt-8 grid gap-3">
        {list.map((p) => {
          const look = LOOKS.find((l) => l.id === p.look) ?? LOOKS[0]!;
          return (
            <li key={p.id}>
              <button
                onClick={async () => {
                  if (p.pinHash) setAsking(p);
                  else await openProfile(p.id);
                }}
                className="flex min-h-16 w-full items-center gap-4 rounded-card border border-line bg-surface px-5 text-start hover:border-dim/40"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: look.bg, color: look.glow }}>
                  <UserCircle size={26} weight="fill" />
                </span>
                <span className="min-w-0 flex-1 truncate font-display text-lg font-semibold">{p.name || t.profiles.unnamed}</span>
                {p.pinHash && <LockSimple size={18} weight="bold" className="text-dim" aria-label={t.profiles.lockedWith} />}
              </button>
            </li>
          );
        })}
        <li>
          <button onClick={addProfile} className="flex min-h-14 w-full items-center gap-4 rounded-card border border-dashed border-line px-5 text-start text-dim hover:text-ink">
            <Plus size={20} weight="bold" />
            <span className="font-semibold">{t.profiles.add}</span>
          </button>
        </li>
      </ul>
    </main>
  );
}
