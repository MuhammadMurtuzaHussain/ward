// Every dialog in Ward goes through this one. It is drawn over the whole app (a portal on
// <body>), and while it's open the rest of Ward is inert, so Tab, a screen reader's cursor and
// taps stay inside it. Focus moves in when it opens and back to where it was when it closes.
// Escape closes the top dialog only, and is used up doing it: it never counts as the first
// press of the double-Escape quick exit (privacy.ts). Android's Back button closes it too
// (closeTopDialog, used by backButton.ts).

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { useT } from "../i18n/index.ts";

interface Open {
  close: () => void;
  node: HTMLElement;
}
/** Open dialogs, the top one last. */
const stack: Open[] = [];

/** The app, and every dialog under the top one, can't be reached while a dialog is open. */
function syncInert() {
  const top = stack.at(-1)?.node;
  const root = document.getElementById("root");
  if (root) root.inert = stack.length > 0;
  for (const d of stack) d.node.inert = d.node !== top;
}

/** Close the top dialog. False if none is open. */
export function closeTopDialog(): boolean {
  const top = stack.at(-1);
  top?.close();
  return !!top;
}

export const dialogOpen = () => stack.length > 0;

if (typeof window !== "undefined") {
  // Capture phase, so it runs before the quick-exit listener and can stop it seeing this press.
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" || !stack.length) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      closeTopDialog();
    },
    true,
  );
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const SIZES = {
  // A short step: a PIN pad, a yes or no.
  sm: {
    overlay: "grid place-items-center bg-[color-mix(in_srgb,var(--bg),transparent_15%)]",
    panel: "w-full max-w-sm p-6 pt-10",
  },
  // A form that may scroll.
  lg: {
    overlay: "bg-[color-mix(in_srgb,var(--bg),transparent_10%)]",
    panel: "mx-auto my-8 w-full max-w-xl p-6",
  },
};

export function Dialog({
  open = true,
  onClose,
  labelledBy,
  label,
  size = "sm",
  children,
}: {
  open?: boolean;
  onClose: () => void;
  /** The id of the dialog's heading; or give `label` when it has none. */
  labelledBy?: string;
  label?: string;
  size?: keyof typeof SIZES;
  children: ReactNode;
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <Panel onClose={onClose} labelledBy={labelledBy} label={label} size={size}>
          {children}
        </Panel>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Panel({ onClose, labelledBy, label, size, children }: { onClose: () => void; labelledBy?: string; label?: string; size: keyof typeof SIZES; children: ReactNode }) {
  const t = useT();
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  // What had focus before opening: read while rendering, before a child (the PIN pad) takes it.
  const before = useRef<HTMLElement | null | undefined>(undefined);
  if (before.current === undefined) before.current = document.activeElement as HTMLElement | null;

  useEffect(() => {
    const entry: Open = { close: () => close.current(), node: overlay.current! };
    stack.push(entry);
    syncInert();
    return () => {
      stack.splice(stack.indexOf(entry), 1);
      syncInert();
      // Back where it was; or, if that button is gone (Save became Saved), to the screen's heading.
      const back = before.current?.isConnected && before.current !== document.body ? before.current : document.querySelector<HTMLElement>("#root main h1");
      if (back && !back.hasAttribute("tabindex") && back.matches("h1")) back.setAttribute("tabindex", "-1");
      back?.focus({ preventScroll: true });
    };
  }, []);

  // On open, and whenever a step inside swaps its content: if focus isn't inside any more, bring
  // it back, to the element marked data-autofocus or the dialog itself. A child that took focus
  // on its own (the PIN pad does) keeps it.
  useEffect(() => {
    const p = panel.current!;
    if (!p.contains(document.activeElement)) (p.querySelector<HTMLElement>("[data-autofocus]") ?? p).focus({ preventScroll: true });
  });

  function trap(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const all = [...panel.current!.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.matches(":disabled") && el.getClientRects().length > 0);
    const first = all[0];
    const last = all.at(-1);
    const at = document.activeElement;
    if (!first || !last) return e.preventDefault();
    if (e.shiftKey && (at === first || at === panel.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const s = SIZES[size];
  return (
    <motion.div ref={overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-40 overflow-y-auto p-4 backdrop-blur-md ${s.overlay}`}>
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        tabIndex={-1}
        onKeyDown={trap}
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className={`relative rounded-card border border-line bg-surface outline-none ${s.panel}`}
      >
        <button onClick={() => close.current()} className="absolute end-3 top-3 grid size-11 place-items-center rounded-full text-dim hover:bg-raised hover:text-ink" aria-label={t.common.close}>
          <X size={20} weight="bold" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
