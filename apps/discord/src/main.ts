// Ward for Discord. Two ways in:
//   Personal: a teen installs Ward to their own account and right-clicks any message to check it
//   or save it as evidence. Ward reads only that message and replies only to them.
//   Server mode: a moderator tool, off unless the host sets WARD_SERVER_MODE=on and a server
//   creates a private #ward-alerts channel (docs/SAFEGUARDING.md section 13). Ward then reads
//   messages there as they arrive, tells moderators about dangerous ones, quietly checks on the
//   person they were aimed at, and gives the sender of a hurtful one a private chance to edit or
//   delete. Someone telling what happened to them, or standing up for someone, is never treated
//   as the sender. It never deletes, mutes or bans anyone itself.
// Ward keeps nothing itself: no database, no message logs. Evidence lives in the teen's own DMs,
// and server-mode alerts stay in #ward-alerts like any other Discord message.

import {
  AttachmentBuilder,
  ChannelType,
  Client,
  Events,
  MessageFlags,
  Partials,
  type ChatInputCommandInteraction,
  type Message,
  type MessageContextMenuCommandInteraction,
  type TextChannel,
  type User,
} from "discord.js";
import { CAN_CLEAR, GemmaSecondLook, ollamaTransport, REPORT_SCHEMA, type Judge, type SecondLook, type Want } from "@ward/engine";
import { ELSEWHERE, REGIONS, TAKE_IT_DOWN, type Region } from "../../web/src/lib/help.ts";
import { CHECK, SAVE } from "./commands.ts";
import { fingerprint, fromEmbed, reportFrom, toEmbed, type Evidence } from "./evidence.ts";
import { WardLiteJudge, loadLite } from "./lite.ts";
import { intentsFor, plan, serverModeOn } from "./server.ts";
import { ABOUT, ALERTS, CATEGORY, MEMBER_NOTICE, SAVED_DM_FAILED, alertEmbed, checkEmbed, serverInfo } from "./text.ts";
import { read, type Around } from "./ward.ts";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("Set DISCORD_TOKEN (see apps/discord/README.md).");
/** Off unless WARD_SERVER_MODE=on. It needs Discord's Message Content intent, switched on in the Developer Portal. */
const serverMode = serverModeOn();
/** Quiet periods so a burst of messages means one DM, not ten. Shorten them for testing. */
const NUDGE_MS = Number(process.env.WARD_NUDGE_MINUTES ?? 10) * 60_000;
const CHECKIN_MS = Number(process.env.WARD_CHECKIN_MINUTES ?? 60) * 60_000;

/** What Ward did, never what anyone wrote: ids, kinds and outcomes only. */
function log(...parts: unknown[]) {
  console.log(new Date().toISOString(), ...parts);
}
const VIEWER = "https://github.com/MuhammadMurtuzaHussain/ward/blob/main/viewer/ward-viewer.html";

let judges: Judge[] = [];
// Gemma on the host, if it runs one, takes a second look at messages only Ward Lite flagged.
// It may clear a flag only if that model passed eval/secondlook (CAN_CLEAR); otherwise it confirms.
const gemma = process.env.WARD_GEMMA_MODEL;
const secondLook: SecondLook | undefined = gemma
  ? new GemmaSecondLook(ollamaTransport(gemma, process.env.WARD_OLLAMA_URL || undefined), gemma, CAN_CLEAR.includes(gemma))
  : undefined;

/** The messages before one, for context; empty where Ward can't read the channel. */
async function before(m: Message, n = 8): Promise<Around[]> {
  try {
    const got = await m.channel.messages.fetch({ limit: n, before: m.id });
    return [...got.values()].reverse().filter((x) => x.content.trim()).map((x) => ({ sender: x.author.username, text: x.content, at: x.createdAt }));
  } catch {
    return [];
  }
}

/** Reads a message alone first; only when Ward Lite alone flagged it does Ward fetch context. */
async function readInContext(m: Message) {
  const alone = await read(m.content, m.author.username, m.createdAt, judges, { secondLook });
  if (!alone.unsure) return alone;
  const ctx = await before(m);
  return ctx.length ? read(m.content, m.author.username, m.createdAt, judges, { before: ctx, secondLook }) : alone;
}
const ephemeral = MessageFlags.Ephemeral;

const client = new Client({
  intents: intentsFor(serverMode),
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async (c) => {
  if (process.env.WARD_LITE !== "off") {
    try {
      await loadLite();
      judges = [new WardLiteJudge()];
    } catch (e) {
      log("Ward Lite didn't load; reading with the word lists only.", (e as Error).message);
    }
  }
  log(`Ward is up as ${c.user.tag}: ${judges.length ? "word lists + Ward Lite" : "word lists"}, server mode ${serverMode ? "on" : "off"}, second look ${secondLook ? `${secondLook.name}${secondLook.canClear ? "" : " (confirm only)"}` : "off"}.`);
});

function where(i: MessageContextMenuCommandInteraction) {
  const ch = i.channel;
  const name = ch && "name" in ch && ch.name ? `#${ch.name}` : "";
  if (i.guild) return `${i.guild.name} ${name}`.trim();
  return i.guildId ? `a server ${name}`.trim() : "a DM";
}

async function onCheck(i: MessageContextMenuCommandInteraction) {
  await i.deferReply({ flags: ephemeral });
  const m = i.targetMessage;
  if (!m.content.trim()) return void (await i.editReply("Ward reads words, and this message has none (only images or files)."));
  const r = await readInContext(m);
  await i.editReply({ embeds: [checkEmbed(r, m.author.displayName)] });
}

async function onSave(i: MessageContextMenuCommandInteraction) {
  await i.deferReply({ flags: ephemeral });
  const m = i.targetMessage;
  if (!m.content.trim()) return void (await i.editReply("Ward can only save words, and this message has none. Take a screenshot of it instead."));
  const at = m.createdAt.toISOString();
  const e: Evidence = {
    from: m.author.username,
    shown: m.author.displayName,
    where: where(i),
    at,
    text: m.content,
    link: m.url,
    savedAt: new Date().toISOString(),
    sha256: fingerprint(m.author.username, at, m.content),
  };
  try {
    await i.user.send({ embeds: [toEmbed(e)] });
    await i.editReply("Saved to your DMs with Ward, with a fingerprint that proves later it wasn't changed. When you're ready, `/ward report` turns everything you saved into a report.");
  } catch {
    const file = new AttachmentBuilder(Buffer.from(JSON.stringify(e, null, 2)), { name: "ward-evidence.json" });
    await i.editReply({ content: SAVED_DM_FAILED, embeds: [toEmbed(e)], files: [file] });
  }
}

/** Everything the teen saved: Ward's own evidence DMs to them, newest 500. */
async function savedBy(user: User): Promise<Evidence[]> {
  const dm = await user.createDM();
  const out: Evidence[] = [];
  let before: string | undefined;
  for (let page = 0; page < 5; page++) {
    const batch = await dm.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    for (const msg of batch.values()) {
      if (msg.author.id !== client.user!.id) continue;
      for (const embed of msg.embeds) {
        const e = fromEmbed({ description: embed.description, fields: embed.fields, footer: embed.footer });
        if (e) out.push(e);
      }
    }
    before = batch.last()!.id;
  }
  return out;
}

async function onReport(i: ChatInputCommandInteraction) {
  await i.deferReply({ flags: ephemeral });
  let saved: Evidence[];
  try {
    saved = await savedBy(i.user);
  } catch {
    return void (await i.editReply("Ward couldn't open your DMs. Allow direct messages from apps in Discord's privacy settings, then try again."));
  }
  const others = saved.filter((e) => e.from !== i.user.username);
  if (!others.length) return void (await i.editReply("You haven't saved any messages yet. Right-click a message → **Apps** → **Save as evidence**, then come back."));
  const danger = i.options.getString("in_danger");
  const want = i.options.getString("want") as Want | null;
  const report = await reportFrom(saved, {
    self: i.user.username,
    recipient: i.options.getString("for", true) as "helpline" | "school" | "police" | "adult",
    inDangerNow: danger === "yes" ? true : danger === "no" ? false : null,
    wants: want ? [want] : [],
    reporter: { firstName: i.options.getString("first_name") ?? undefined, ageBand: i.options.getString("age") ?? undefined },
    judges,
  });
  const file = new AttachmentBuilder(Buffer.from(JSON.stringify(report, null, 2)), { name: "ward-report.json" });
  const summary = [
    `**Your Ward report**: ${report.incidents.length} hurtful message${report.incidents.length === 1 ? "" : "s"} from ${report.accounts.length} account${report.accounts.length === 1 ? "" : "s"}, over ${report.conversation.days} day${report.conversation.days === 1 ? "" : "s"}.`,
    `Give \`ward-report.json\` to the person you chose. They can check nothing was changed with the free Ward case viewer (${VIEWER}) or Ward's counsellor mode. Format: ${REPORT_SCHEMA}.`,
    danger === "yes" ? "\n**You said you're in danger right now.** Please tell an adult near you, or call your local emergency number. `/ward help` has free helplines." : "",
  ].join("\n");
  try {
    await i.user.send({ content: summary, files: [file] });
    await i.editReply("Your report is in your DMs with Ward.");
  } catch {
    await i.editReply({ content: summary, files: [file] });
  }
}

async function onHelp(i: ChatInputCommandInteraction) {
  const region = REGIONS.find((r) => r.id === i.options.getString("country")) ?? null;
  // Some countries have no confirmed emergency number in help.ts; never print a guess.
  const sos = (r: Region) => r.emergency ?? "your local emergency number";
  const lines = region
    ? [`**${region.name}** · emergency: **${sos(region)}**`, ...region.lines.map((l) => `• **${l.name}**: ${l.number}. ${l.note}`)]
    : REGIONS.map((r) => `**${r.name}**: ${r.lines.map((l) => `${l.name} ${l.number}`).join(" · ")} · emergency ${sos(r)}`);
  lines.push(`• Anywhere else: **${ELSEWHERE.name}**, ${ELSEWHERE.url}. ${ELSEWHERE.note}`);
  lines.push(`• **${TAKE_IT_DOWN.name}**: ${TAKE_IT_DOWN.url}. ${TAKE_IT_DOWN.note}`);
  lines.push("• Discord's own safety help: https://discord.com/safety");
  lines.push("\nTalking to someone isn't telling on anyone. It's getting backup.");
  await i.reply({ content: lines.join("\n").slice(0, 2000), flags: ephemeral });
}

async function onServer(i: ChatInputCommandInteraction) {
  const alerts = i.guild?.channels.cache.find((c) => c.name === ALERTS && c.type === ChannelType.GuildText) as TextChannel | undefined;
  await i.reply({ flags: ephemeral, content: serverInfo({ hostOn: serverMode, inServer: Boolean(i.guild), alertsId: alerts?.id }) });
  // The notice on its own, so moderators can copy it whole.
  await i.followUp({ flags: ephemeral, content: `**A notice to pin for members**\n\`\`\`\n${MEMBER_NOTICE}\n\`\`\`` });
}

client.on(Events.InteractionCreate, async (i) => {
  const what = i.isCommand() ? `${i.commandName}${i.isChatInputCommand() ? ` ${i.options.getSubcommand(false) ?? ""}` : ""}` : i.type;
  log(`interaction: ${what} (${i.guildId ? "server" : "DM"})`);
  try {
    if (i.isMessageContextMenuCommand()) {
      if (i.commandName === CHECK) await onCheck(i);
      else if (i.commandName === SAVE) await onSave(i);
    } else if (i.isChatInputCommand() && i.commandName === "ward") {
      const sub = i.options.getSubcommand();
      if (sub === "report") await onReport(i);
      else if (sub === "help") await onHelp(i);
      else if (sub === "server") await onServer(i);
      else await i.reply({ content: ABOUT, flags: ephemeral });
    }
  } catch (e) {
    log(`interaction failed: ${what}:`, (e as Error).message);
    if (i.isRepliable()) {
      const msg = { content: "Something went wrong on Ward's side. Try again in a moment.", flags: ephemeral } as const;
      await (i.deferred || i.replied ? i.editReply(msg.content) : i.reply(msg)).catch(() => {});
    }
  }
});

// Server mode. In-memory rate limits only, so a burst of messages means one DM, not ten.
const lastNudge = new Map<string, number>();
const lastCheckIn = new Map<string, number>();
function due(map: Map<string, number>, key: string, ms: number) {
  const now = Date.now();
  if ((map.get(key) ?? 0) > now - ms) return false;
  map.set(key, now);
  if (map.size > 5000) for (const [k, t] of map) if (t < now - ms) map.delete(k);
  return true;
}

async function onMessage(m: Message) {
  if (!m.inGuild() || m.author.bot || !m.content.trim()) return;
  const alerts = m.guild.channels.cache.find((c) => c.name === ALERTS && c.type === ChannelType.GuildText) as TextChannel | undefined;
  if (!alerts) return;
  const r = await readInContext(m);
  if (r.severity === 0) return;
  const did: string[] = [];
  const kinds = r.categories.map((c) => CATEGORY[c]).join(", ");
  // Before any nudge or check-in: is the writer telling what happened to them, or standing up
  // for someone? Then they are never treated as the sender (src/server.ts).
  const p = plan(r, m.content, alerts.topic ?? "");

  if (p.alert) {
    const from = `${m.author} (@${m.author.username})`;
    await alerts.send({ embeds: [alertEmbed(r, p.alert, { channel: m.channel.name, url: m.url, from, text: m.content })], allowedMentions: { parse: [] } });
    did.push(`alerted mods (${p.alert})`);
  }

  if (r.unsure) return void log(`server message: severity ${r.severity}, not sure (only Ward Lite, nothing around it): nothing sent`);
  if (p.frame) return void log(`server message: severity ${r.severity}, ${p.frame}: ${did.join(", ") || "nothing sent"}; no nudge, no check-in`);
  if (p.nudge && !due(lastNudge, `${m.guildId}:${m.author.id}`, NUDGE_MS)) did.push("nudge skipped (sent one recently)");
  else if (p.nudge) {
    did.push("nudged sender");
    await m.author
      .send(
        `Hey, Ward here (the helper in **${m.guild.name}**). Your message in #${m.channel.name} might land harder than you meant${kinds ? ` (${kinds})` : ""}. You can still edit or delete it: ${m.url}\nIf something's going on with you, \`/ward help\` has people to talk to.`,
      )
      .catch(() => {});
  }

  if (p.checkIn) {
    const replyTo = m.reference?.messageId ? await m.channel.messages.fetch(m.reference.messageId).catch(() => null) : null;
    const targets = new Map<string, User>();
    for (const u of m.mentions.users.values()) if (!u.bot && u.id !== m.author.id) targets.set(u.id, u);
    if (replyTo && !replyTo.author.bot && replyTo.author.id !== m.author.id) targets.set(replyTo.author.id, replyTo.author);
    for (const u of targets.values()) {
      if (!due(lastCheckIn, `${m.guildId}:${u.id}`, CHECKIN_MS)) {
        did.push("check-in skipped (sent one recently)");
        continue;
      }
      did.push("checked in on target");
      await u
        .send(
          `Hi, Ward here (the helper in **${m.guild.name}**). Someone sent something rough your way in #${m.channel.name}. It isn't your fault.\n• To keep proof: right-click the message → **Apps** → **Save as evidence**.\n• \`/ward help\` lists free, private people to talk to.\n• The server's moderators ${r.dangerous ? "have been told" : "can help"}.`,
        )
        .catch(() => {});
    }
  }
  log(`server message: severity ${r.severity}${r.dangerous ? ", dangerous" : ""}: ${did.join(", ") || "nothing to send (unkind, or nobody to check in on)"}`);
}

if (serverMode) client.on(Events.MessageCreate, (m) => void onMessage(m).catch((e) => log("message check failed:", (e as Error).message)));

// Keep running through Discord hiccups, and say so, instead of dying or going silent.
client.on(Events.Error, (e) => log("discord error:", e.message));
client.on(Events.Warn, (w) => log("discord warning:", w));
client.on(Events.ShardDisconnect, (e, id) => log(`disconnected (shard ${id}, code ${e.code}); reconnecting`));
client.on(Events.ShardResume, (id) => log(`reconnected (shard ${id})`));
client.rest.on("rateLimited", (r) => log(`rate limited on ${r.route} for ${r.timeToReset} ms`));
process.on("unhandledRejection", (e) => log("unhandled:", (e as Error)?.message ?? e));

// On a host that expects a web service (Render), answer health checks on $PORT. Nothing else is served.
if (process.env.PORT) {
  const { createServer } = await import("node:http");
  const { handleGemma } = await import("./gemmaDemo.ts");
  createServer((req, res) => {
    void handleGemma(req, res).then((handled) => {
      if (!handled) res.writeHead(client.isReady() ? 200 : 503, { "content-type": "text/plain" }).end(client.isReady() ? "ok" : "starting");
    });
  }).listen(Number(process.env.PORT), "0.0.0.0");
}

process.on("SIGTERM", () => void client.destroy().then(() => process.exit(0)));
await client.login(token);
