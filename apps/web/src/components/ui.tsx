// The handful of building blocks every screen uses. One radius system (card and button radii
// from the age band), one accent (the look's glow), Phosphor icons at one weight.

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { back } from "../lib/store.ts";

type Tone = "glow" | "quiet" | "alarm" | "ghost";

export function Button({ tone = "glow", className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    glow: "bg-glow text-glow-ink shadow-[0_8px_30px_-10px_var(--halo)] hover:brightness-105",
    quiet: "bg-raised text-ink hover:bg-[color-mix(in_srgb,var(--raised),var(--ink)_6%)]",
    alarm: "bg-alarm text-[#1c0505] hover:brightness-105",
    ghost: "text-ink hover:bg-raised",
  };
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-btn px-5 font-display text-[1.02rem] font-semibold tracking-tight transition-[transform,filter,background-color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "", as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={`rounded-card border border-line bg-surface ${className}`}>{children}</As>;
}

export function BackBar({ title, right }: { title?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex min-h-12 items-center gap-2">
      <button onClick={() => back()} className="-ml-2 grid size-11 place-items-center rounded-full text-dim hover:bg-raised hover:text-ink" aria-label="Back">
        <ArrowLeft size={22} weight="bold" />
      </button>
      {title && <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>}
      <div className="ml-auto">{right}</div>
    </div>
  );
}

export function Pill({ children, tone = "quiet" }: { children: ReactNode; tone?: "quiet" | "glow" | "alarm" | "safe" }) {
  const t = {
    quiet: "bg-raised text-dim",
    glow: "bg-glow-soft text-glow",
    alarm: "bg-alarm-soft text-alarm",
    safe: "bg-[color-mix(in_srgb,var(--safe),transparent_86%)] text-safe",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8rem] font-bold ${t}`}>{children}</span>;
}

export function Screen({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full px-4 pb-32 pt-4 sm:px-6 lg:pb-16 lg:pt-8 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>{children}</div>;
}
