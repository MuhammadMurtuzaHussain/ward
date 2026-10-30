// Renders a ward.report/v2 (built in @ward/engine) as a page a person can read, and exports it
// with the JSON alongside so a helpline can import or verify it. Printed to PDF on desktop,
// shared as files on phones. Plain HTML so it needs nothing online.

import type { WardReport } from "@ward/engine";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "no time in source");

const FOR: Record<WardReport["recipient"], string> = {
  helpline: "For a helpline",
  school: "For my school",
  police: "For the police",
  adult: "For a trusted adult",
};

const SEVERITY = ["", "Unkind", "Bullying", "Dangerous"];

export function reportHtml(r: WardReport): string {
  const who = [r.reporter.firstName, r.reporter.ageBand && `age ${r.reporter.ageBand === "8" ? "8 to 10" : r.reporter.ageBand === "11" ? "11 to 13" : "14 to 17"}`, r.reporter.city, r.reporter.country].filter(Boolean).join(", ");
  const danger = r.safety.inDangerNow === true;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Report: ${esc(r.conversation.title)}</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; color: #17183a; margin: 28px; max-width: 900px; }
  h1 { font-size: 22px; margin: 0; } h2 { font-size: 15px; margin: 22px 0 6px; }
  .meta { color: #50536f; } .box { border: 1px solid #d9dbe8; border-radius: 10px; padding: 12px 14px; margin-top: 10px; }
  .alarm { border-color: #c42b2b; background: #fdeaea; } ul { margin: 6px 0; padding-left: 18px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid #e3e5ef; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #50536f; }
  tr.s3 td { background: #fdeaea; } .why { color: #50536f; font-size: 12px; }
  .mono { font-family: ui-monospace, monospace; font-size: 11px; color: #50536f; word-break: break-all; }
</style></head><body>
<p class="meta">${esc(FOR[r.recipient])}. Made with Ward on ${esc(when(r.createdAt))}.</p>
<h1>Online bullying report: ${esc(r.conversation.title)}</h1>
${who ? `<p>From: <b>${esc(who)}</b></p>` : ""}
<div class="box ${danger || r.safety.dangerous.length ? "alarm" : ""}">
  <b>${danger ? "The child says they are in danger right now." : r.safety.inDangerNow === false ? "The child says they are not in immediate danger." : "The child didn't say whether they are in danger now."}</b>
  ${r.safety.dangerous.length ? `<br>The messages include: ${esc(r.safety.dangerous.map((c) => ({ threat: "threats of violence", selfharm: "telling them to hurt or kill themselves", sexual: "sexual messages or pressure for photos", exposure: "threats to share photos or private information" })[c as string] ?? c).join("; "))}.` : ""}
</div>
${r.wants.length ? `<h2>What they want to happen</h2><ul>${r.wants.map((w) => `<li>${esc(w.label)}</li>`).join("")}</ul>` : ""}
<h2>What happened</h2>
<p>${r.incidents.length} hurtful messages from ${r.accounts.length} ${r.accounts.length === 1 ? "account" : "accounts"} on ${esc(r.conversation.platform)}${r.conversation.firstIncident ? `, between ${esc(when(r.conversation.firstIncident))} and ${esc(when(r.conversation.lastIncident))} (${r.conversation.days} ${r.conversation.days === 1 ? "day" : "days"})` : ""}. The chat had ${r.conversation.messages} messages and ${r.conversation.participants} people.</p>
<ul>${r.patterns.map((p) => `<li>${esc(p.fact)}</li>`).join("")}</ul>
<h2>Accounts involved</h2>
<table><thead><tr><th>Name shown in the chat</th><th>Hurtful messages</th><th>Worst</th><th>Notes</th></tr></thead><tbody>
${r.accounts.map((a) => `<tr><td>${esc(a.name)}</td><td>${a.hurtfulMessages}</td><td>${SEVERITY[a.worstSeverity]}</td><td>${[a.addedDuringChat && "added to the group during the chat", a.onlyAttacked && "only sent hurtful messages"].filter(Boolean).join("; ")}</td></tr>`).join("\n")}
</tbody></table>
<h2>Every hurtful message</h2>
<table><thead><tr><th>When</th><th>From</th><th>Message</th><th>Fingerprint</th></tr></thead><tbody>
${r.incidents.map((i) => `<tr class="s${i.severity}"><td>${esc(when(i.at))}</td><td>${esc(i.from)}</td><td>${esc(i.text)}${i.why ? `<div class="why">${esc(i.why)}</div>` : ""}</td><td class="mono">${esc(i.sha256.slice(0, 16))}</td></tr>`).join("\n")}
</tbody></table>
<h2>About this evidence</h2>
<p class="meta">Exported from ${r.conversation.source === "whatsapp" ? "WhatsApp's own Export chat" : "a pasted copy of the chat"} and kept in Ward's encrypted vault on the child's device from ${esc(when(r.integrity.savedAt))}. Each message has a SHA-256 fingerprint taken when it was saved; the whole report's digest is below, and the attached ward-report.json can be checked against it with the free, offline Ward case viewer (github.com/MuhammadMurtuzaHussain/ward/blob/main/viewer/ward-viewer.html; format: ward.report/v2, docs/REPORT.md). Ward runs on the device; nothing was uploaded. Ward's notes under each message were written by ${esc(r.tool.models.join(", ") || "word lists")}, not by a person, and can be wrong.</p>
<p class="mono">Digest: ${esc(r.integrity.digest)}</p>
</body></html>`;
}

function slug(s: string) {
  return s.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 40) || "chat";
}

export async function exportReport(r: WardReport) {
  const base = `Ward report - ${slug(r.conversation.title)}`;
  const html = new File([reportHtml(r)], `${base}.html`, { type: "text/html" });
  const json = new File([JSON.stringify(r, null, 2)], "ward-report.json", { type: "application/json" });
  if (navigator.canShare?.({ files: [html, json] })) {
    try {
      await navigator.share({ files: [html, json], title: base });
      return;
    } catch {
      // cancelled: fall through to print and download
    }
  }
  for (const f of [json]) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(reportHtml(r));
    w.document.close();
    w.focus();
    w.print();
  }
}
