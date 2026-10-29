// Ward, the ghost on your side. The bully is the ghost haunting the chat; Ward is the one who
// leaves a light on. A simple geometric figure so it can change expression in lessons and in
// scary moments without a sprite sheet.

import { motion, useReducedMotion } from "motion/react";

export type Mood = "happy" | "cheer" | "calm" | "worried" | "think" | "sleep";

const BODY =
  "M20 70 A40 40 0 0 1 100 70 L100 118 q-6.67 10 -13.33 0 t-13.33 0 t-13.33 0 t-13.34 0 t-13.33 0 t-13.33 0 Z";

function Eyes({ mood }: { mood: Mood }) {
  const ink = "var(--bg)";
  if (mood === "cheer")
    return (
      <g fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round">
        <path d="M41 74 q6 -9 12 0" />
        <path d="M67 74 q6 -9 12 0" />
      </g>
    );
  if (mood === "sleep" || mood === "calm")
    return (
      <g fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round">
        <path d={mood === "sleep" ? "M41 72 q6 6 12 0" : "M42 72 q5 4 10 0"} />
        <path d={mood === "sleep" ? "M67 72 q6 6 12 0" : "M68 72 q5 4 10 0"} />
      </g>
    );
  const dx = mood === "think" ? 3 : 0;
  const dy = mood === "think" ? -3 : 0;
  return (
    <g fill={ink} style={{ transformOrigin: "60px 72px", animation: "ward-blink 5s infinite" }}>
      <ellipse cx={47 + dx} cy={72 + dy} rx={mood === "worried" ? 5.5 : 5} ry={mood === "worried" ? 7.5 : 7} />
      <ellipse cx={73 + dx} cy={72 + dy} rx={mood === "worried" ? 5.5 : 5} ry={mood === "worried" ? 7.5 : 7} />
      {mood === "worried" && (
        <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
          <path d="M40 60 l10 -3" />
          <path d="M80 60 l-10 -3" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const ink = "var(--bg)";
  switch (mood) {
    case "cheer":
      return <path d="M50 86 q10 12 20 0 z" fill={ink} />;
    case "worried":
      return <path d="M54 91 q6 -4 12 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />;
    case "think":
      return <path d="M55 89 h10" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />;
    case "sleep":
      return <ellipse cx="60" cy="89" rx="3" ry="2.5" fill={ink} />;
    default:
      return <path d="M53 86 q7 7 14 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />;
  }
}

export function Ghost({ mood = "happy", size = 120, glow = true, className = "", label }: { mood?: Mood; size?: number; glow?: boolean; className?: string; label?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`relative inline-grid place-items-center ${className}`}
      style={{ width: size, height: size * 1.17 }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      key={mood}
      initial={reduce ? false : { scale: 0.92, rotate: mood === "cheer" ? -6 : 0 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 14 }}
    >
      {glow && (
        <div
          className="absolute inset-[-28%] rounded-full"
          style={{ background: "radial-gradient(closest-side, var(--halo), transparent 72%)" }}
        />
      )}
      <svg viewBox="0 0 120 140" width="100%" height="100%" style={{ animation: reduce ? undefined : "ward-float 4.5s ease-in-out infinite", overflow: "visible" }}>
        <path d={BODY} fill="var(--ink)" />
        <path d={BODY} fill="url(#ward-sheen)" />
        <defs>
          <radialGradient id="ward-sheen" cx="35%" cy="25%" r="80%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="0.6" stopColor="var(--glow)" stopOpacity="0.08" />
            <stop offset="1" stopColor="var(--glow)" stopOpacity="0.22" />
          </radialGradient>
        </defs>
        <ellipse cx="37" cy="86" rx="6" ry="3.5" fill="var(--glow)" opacity={mood === "worried" ? 0 : 0.55} />
        <ellipse cx="83" cy="86" rx="6" ry="3.5" fill="var(--glow)" opacity={mood === "worried" ? 0 : 0.55} />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </svg>
    </motion.div>
  );
}
