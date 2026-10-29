// A one-page evidence report a child can hand to a school or the police: what happened, when,
// who, and every hurtful message with its time and fingerprint. Printed to PDF on desktop,
// shared as a file on phones. Built as plain HTML so it needs nothing online.

import type { VaultItem } from "./vault.ts";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function reportHtml(item: VaultItem, by: string): string {
  const a = item.analysis;
  const hostile = a.findings.filter((f) => f.severity > 0 && f.message.sender !== item.self);
  const fp = new Map(item.chat.messages.map((m, i) => [m.id, item.fingerprints[i] ?? ""]));
  const first = hostile.find((f) => f.message.at)?.message.at;
  const last = [...hostile].reverse().find((f) => f.message.at)?.message.at;
  const fmt = (d: Date | null) => (d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "no time in source");
  const rows = hostile
    .map(
      (f) => `<tr class="s${f.severity}">
  <td>${esc(fmt(f.message.at))}</td>
  <td>${esc(f.message.sender)}</td>
  <td>${esc(f.message.text)}${f.why ? `<div class="why">${esc(f.why)}</div>` : ""}</td>
  <td class="fp">${esc((fp.get(f.message.id) ?? "").slice(0, 16))}</td>
</tr>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Evidence report: ${esc(item.title)}</title>
<style>
  body { font: 13px/1.45 system-ui, sans-serif; color: #17183a; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #50536f; margin-bottom: 18px; }
  ul { padding-left: 18px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid #d9dbe8; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #50536f; }
  tr.s3 td { background: #fdeaea; }
  .why { color: #50536f; font-size: 12px; margin-top: 2px; }
  .fp { font-family: ui-monospace, monospace; font-size: 11px; color: #50536f; }
  .foot { margin-top: 22px; color: #50536f; font-size: 11px; }
</style></head><body>
<h1>Evidence report: ${esc(item.title)}</h1>
<div class="meta">Prepared by ${esc(by || "the person being targeted")} with Ward on ${esc(new Date().toLocaleDateString(undefined, { dateStyle: "long" }))}.
${first ? `Messages from ${esc(fmt(first))} to ${esc(fmt(last ?? first))}.` : ""}</div>
<h2>What happened</h2>
<ul>${a.patterns.map((p) => `<li>${esc(p.summary)}</li>`).join("") || "<li>Hurtful messages, listed below.</li>"}</ul>
<p><b>${hostile.length}</b> hurtful messages from <b>${new Set(hostile.map((f) => f.message.sender)).size}</b> people, out of ${a.findings.length} in the chat.</p>
<table><thead><tr><th>When</th><th>From</th><th>Message</th><th>Fingerprint</th></tr></thead><tbody>
${rows}
</tbody></table>
<p class="foot">The chat was exported from ${item.chat.source === "whatsapp" ? "WhatsApp" : "a pasted copy"} and saved in Ward's encrypted vault on ${esc(new Date(item.savedAt).toLocaleString())}. Each fingerprint is the start of a SHA-256 hash of the sender, time and text, taken when it was saved, so later changes would show. Ward runs entirely on the device; nothing was uploaded.</p>
</body></html>`;
}

export async function exportReport(item: VaultItem, by: string) {
  const html = reportHtml(item, by);
  const name = `Ward evidence - ${item.title.replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 40)}.html`;
  const file = new File([html], name, { type: "text/html" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch {
      // cancelled: fall through to print/download
    }
  }
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
