// A drop zone with a glowing rim and a light that travels around its edge, adapted from the
// idea in cult-ui's Halo Dropzone (21st.dev): a CSS offset-path trail plus slow blobs of the
// look's glow pooled at the bottom. Pure CSS motion, stopped under reduced motion.

import { useRef, useState, type ReactNode } from "react";
import { UploadSimple } from "@phosphor-icons/react";

export function HaloDrop({ accept, multiple, onFiles, children }: { accept: string; multiple?: boolean; onFiles: (files: File[]) => void; children?: ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = [...e.dataTransfer.files];
        if (files.length) onFiles(files);
      }}
      className={`relative isolate overflow-hidden rounded-card border transition-colors ${over ? "border-glow bg-glow-soft" : "border-line bg-surface"}`}
    >
      {/* travelling light on the rim */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      >
        <div
          className="absolute h-6 w-40 rounded-full"
          style={{
            offsetPath: "rect(0 auto auto 0 round var(--r-card))",
            offsetDistance: "0%",
            animation: `rim-trail ${over ? 2.2 : 7}s linear infinite`,
            background: "radial-gradient(closest-side, var(--glow), transparent)",
            filter: "blur(3px)",
          }}
        />
      </div>
      {/* light pooled at the bottom */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2">
        <div className="absolute -bottom-12 left-1/4 h-28 w-2/3 rounded-full blur-3xl" style={{ background: "var(--glow)", opacity: over ? 0.35 : 0.14, animation: "rim-drift 9s ease-in-out infinite" }} />
      </div>

      <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-raised text-glow" style={{ animation: "ward-float 3.5s ease-in-out infinite" }}>
          <UploadSimple size={26} weight="bold" />
        </span>
        {children}
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}
