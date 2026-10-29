// Builds viewer/sample-report.json from the engine's Roman Urdu pile-on fixture, with the same
// buildReport the app uses, and embeds it in ward-viewer.html for "Try a sample report".
// Run: node --experimental-strip-types viewer/make-sample.ts

import { readFileSync, writeFileSync } from "node:fs";
import { analyze, buildReport, fingerprintMessages, parseChat } from "../packages/engine/src/index.ts";

const chat = parseChat(readFileSync(new URL("../packages/engine/fixtures/pileon-roman-urdu.txt", import.meta.url), "utf8"));
const analysis = await analyze(chat, { self: "Ayesha" });
const report = await buildReport({
  chat,
  analysis,
  fingerprints: await fingerprintMessages(chat),
  savedAt: new Date("2026-10-15T10:00:00Z"),
  title: "8B Science (sample)",
  platform: "WhatsApp",
  reporter: { firstName: "Ayesha", ageBand: "11", city: "Lahore", country: "Pakistan" },
  inDangerNow: false,
  wants: ["stop", "school"],
  recipient: "helpline",
});
const json = JSON.stringify(report, null, 2);
writeFileSync(new URL("./sample-report.json", import.meta.url), json + "\n");

const page = new URL("./ward-viewer.html", import.meta.url);
const html = readFileSync(page, "utf8").replace(
  /(<script type="application\/json" id="sample">)[\s\S]*?(<\/script>)/,
  (_, a, b) => `${a}${JSON.stringify(report).replace(/</g, "\\u003c")}${b}`,
);
writeFileSync(page, html);
console.log(`sample: ${report.incidents.length} incidents, level ${report.safety.level}`);
