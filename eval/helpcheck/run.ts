// The help-page checker: are the Coach's "how to report, block or save proof" steps still true?
// Apps move their buttons. For each app in the Coach (apps/web/src/i18n/en.ts, coach.apps) and each
// action, SerpApi finds the app's own current help page, Browserbase loads it in a real browser,
// and the page's words are compared with Ward's. Results go to eval/helpcheck/report.{json,md}.
//
//   pnpm helpcheck                     every app, every action
//   pnpm helpcheck -- --only=TikTok    one app
//
// Keys come from ward/.env (SERPAPI_KEY, BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID). Only public
// help pages are read: no chat, no child's words, nothing from the app ever goes out.
// A drift flag is a prompt for a person to look, not proof the step is wrong.

import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { en } from "../../apps/web/src/i18n/en.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const envFile = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
const { SERPAPI_KEY, BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID } = process.env;
if (!SERPAPI_KEY || !BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
  console.error("Missing keys. Put SERPAPI_KEY, BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID in ward/.env.");
  process.exit(1);
}

/** Each app's own help domain: a search hit anywhere else is not "official". */
const DOMAINS: Record<string, string> = {
  WhatsApp: "faq.whatsapp.com",
  Instagram: "help.instagram.com",
  TikTok: "support.tiktok.com",
  Snapchat: "help.snapchat.com",
  Discord: "support.discord.com",
};
const ACTIONS = { report: "report message", block: "block someone", proof: "screenshot save chat" } as const;
type Action = keyof typeof ACTIONS;

/** The button and menu names in Ward's steps: the words a child looks for on screen. */
function uiTerms(steps: string[]): string[] {
  const terms = new Set<string>();
  for (const step of steps) {
    for (const m of step.matchAll(/\b(?:[A-Z][a-z]+(?: [A-Z][a-z]+)*|three dots|share arrow|press and hold|right-click)\b/g)) {
      const t = m[0].replace(/^Tap /, "");
      if (/^(Tap|Press|Open|On|In|For|Scroll|Tell|Snaps|Save|Reports|They|Mute|You|WhatsApp|Instagram|TikTok|Snapchat|Discord)$/.test(t)) continue;
      terms.add(t.toLowerCase());
    }
  }
  return [...terms];
}

// DuckDuckGo, because SerpApi's Google and Bing engines ignore `site:`.
async function search(app: string, action: Action): Promise<{ url: string; title: string } | null> {
  const q = `site:${DOMAINS[app]} ${ACTIONS[action]}`;
  const res = await fetch(`https://serpapi.com/search.json?${new URLSearchParams({ engine: "duckduckgo", q, api_key: SERPAPI_KEY! })}`);
  if (!res.ok) throw new Error(`SerpApi ${res.status}: ${await res.text()}`);
  const hits: { link: string; title: string }[] = (await res.json()).organic_results ?? [];
  const hit = hits.find((h) => new URL(h.link).hostname.endsWith(DOMAINS[app]!) && !/\/(community|contact)\//.test(h.link)); // forum posts and forms are not help articles
  return hit ? { url: hit.link, title: hit.title } : null;
}

/** Load a page in a Browserbase browser over plain CDP (Node's own WebSocket, no extra packages). */
async function pageText(url: string): Promise<string> {
  const headers = { "X-BB-API-Key": BROWSERBASE_API_KEY!, "Content-Type": "application/json" };
  const made = await fetch("https://api.browserbase.com/v1/sessions", { method: "POST", headers, body: JSON.stringify({ projectId: BROWSERBASE_PROJECT_ID }) });
  if (!made.ok) throw new Error(`Browserbase ${made.status}: ${await made.text()}`);
  const { id, connectUrl } = (await made.json()) as { id: string; connectUrl: string };
  const ws = new WebSocket(connectUrl);
  let next = 0;
  const waiting = new Map<number, (r: any) => void>();
  ws.onmessage = (e) => {
    const msg = JSON.parse(String(e.data));
    if (msg.id && waiting.has(msg.id)) waiting.get(msg.id)!(msg);
  };
  const send = (method: string, params: object = {}, sessionId?: string) =>
    new Promise<any>((ok, fail) => {
      const n = ++next;
      waiting.set(n, (m) => (m.error ? fail(new Error(`${method}: ${m.error.message}`)) : ok(m.result)));
      ws.send(JSON.stringify({ id: n, method, params, sessionId }));
    });
  try {
    await new Promise((ok, fail) => ((ws.onopen = ok), (ws.onerror = () => fail(new Error("CDP connect failed")))));
    const { targetInfos } = await send("Target.getTargets");
    const page = targetInfos.find((t: any) => t.type === "page") ?? { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
    const { sessionId } = await send("Target.attachToTarget", { targetId: page.targetId, flatten: true });
    await send("Page.enable", {}, sessionId);
    await send("Page.navigate", { url }, sessionId);
    // Help centres render with script; wait until the text stops growing.
    let text = "";
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const { result } = await send("Runtime.evaluate", { expression: "document.body ? document.body.innerText : ''", returnByValue: true }, sessionId);
      if (result.value.length > 500 && result.value.length === text.length) break;
      text = result.value;
    }
    return text;
  } finally {
    ws.close();
    await fetch(`https://api.browserbase.com/v1/sessions/${id}`, { method: "POST", headers, body: JSON.stringify({ projectId: BROWSERBASE_PROJECT_ID, status: "REQUEST_RELEASE" }) }).catch(() => {});
  }
}

/** The numbered or short lines on the page that read like steps. */
function pageSteps(text: string, action: Action): string[] {
  const verb = { report: /report/i, block: /block/i, proof: /screenshot|save|evidence|export/i }[action];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 8 && l.length < 220 && /^(\d+[.)]|tap|press|select|open|go to|click|choose)/i.test(l) && verb.test(l))
    .slice(0, 8);
}

interface Row {
  app: string;
  action: Action;
  url: string | null;
  title?: string;
  wardSteps: string[];
  pageSteps: string[];
  found: string[];
  missing: string[];
  status: "ok" | "drift" | "no-ward-step" | "no-page" | "error";
  error?: string;
}

const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const apps = Object.keys(en.coach.apps).filter((a) => !only || a === only);
const rows: Row[] = [];

for (const app of apps) {
  const steps = en.coach.apps[app]!;
  for (const action of Object.keys(ACTIONS) as Action[]) {
    const verb = { report: /report/i, block: /block|restrict|exit/i, proof: /screenshot|evidence|save/i }[action];
    const wardSteps = steps.filter((s) => verb.test(s));
    const row: Row = { app, action, url: null, wardSteps, pageSteps: [], found: [], missing: [], status: "no-page" };
    rows.push(row);
    process.stdout.write(`${app} / ${action} … `);
    try {
      const hit = await search(app, action);
      if (!hit) {
        console.log("no official page found");
        continue;
      }
      row.url = hit.url;
      row.title = hit.title;
      const text = (await pageText(hit.url)).toLowerCase();
      row.pageSteps = pageSteps(text, action);
      for (const term of uiTerms(wardSteps)) (text.includes(term) ? row.found : row.missing).push(term);
      row.status = !row.found.length && !row.missing.length ? "no-ward-step" : row.missing.length ? "drift" : "ok";
      console.log(row.status, row.missing.length ? `(not on page: ${row.missing.join(", ")})` : "");
    } catch (e) {
      row.status = "error";
      row.error = (e as Error).message;
      console.log("error:", row.error);
    }
  }
}

const date = new Date().toISOString().slice(0, 10);
writeFileSync(`${here}report.json`, JSON.stringify({ date, rows }, null, 2) + "\n");

const md = [
  `# Help-page check, ${date}`,
  "",
  "Ward's Coach steps (apps/web/src/i18n/en.ts, `coach.apps`) against each app's own help page today.",
  "**no-ward-step**: Ward gives no step for this action in this app, so there is nothing to compare (the page is still linked). **drift** means a button or menu name Ward tells kids to look for wasn't on the page: a person should check the app and the page, then fix `en.ts` and `ur.ts` together. Written by `pnpm helpcheck`.",
  "",
  "| App | Action | Status | Not on the page | Help page |",
  "| --- | --- | --- | --- | --- |",
  ...rows.map((r) => `| ${r.app} | ${r.action} | ${r.status} | ${r.missing.join(", ") || (r.error ? r.error.slice(0, 80) : "")} | ${r.url ? `[${(r.title ?? r.url).replace(/\|/g, "/")}](${r.url})` : "none found"} |`),
  "",
  ...rows
    .filter((r) => r.status === "drift")
    .flatMap((r) => [`## ${r.app}: ${r.action}`, "", "Ward says:", ...r.wardSteps.map((s) => `- ${s}`), "", "The page says:", ...(r.pageSteps.length ? r.pageSteps.map((s) => `- ${s}`) : ["- (no step-like lines found; read the page)"]), ""]),
].join("\n");
writeFileSync(`${here}report.md`, md);
console.log(`\nWrote eval/helpcheck/report.{json,md}: ${rows.filter((r) => r.status === "ok").length} ok, ${rows.filter((r) => r.status === "drift").length} drift, ${rows.filter((r) => r.status === "no-page" || r.status === "error").length} unchecked.`);
