// Ward for Discord. Two ways in:
//   Personal: a teen installs Ward to their own account and right-clicks any message to check it
//   or save it as evidence. Ward reads only that message and replies only to them.
//   Server mode: a server that wants it creates a private #ward-alerts channel. Ward then reads
//   messages there as they arrive, tells moderators about dangerous ones, quietly checks on the
//   person they were aimed at, and gives the sender a private chance to edit or delete. It never
//   deletes, mutes or bans anyone itself.
// Nothing is stored: no database, no message logs. Evidence lives in the teen's own DMs.

import {
  AttachmentBuilder,
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  type ChatInputCommandInteraction,
  type Message,
  type MessageContextMenuCommandInteraction,
  type TextChannel,
  type User,
} from "discord.js";
import { REPORT_SCHEMA, type Judge, type Want } from "@ward/engine";
import { ELSEWHERE, REGIONS, TAKE_IT_DOWN } from "../../web/src/lib/help.ts";
import { CHECK, SAVE } from "./commands.ts";
import { fingerprint, fromEmbed, reportFrom, toEmbed, type Evidence } from "./evidence.ts";
import { WardLiteJudge, loadLite } from "./lite.ts";
import { ABOUT, CATEGORY, SAVED_DM_FAILED, VERDICT, checkEmbed } from "./text.ts";
import { read } from "./ward.ts";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("Set DISCORD_TOKEN (see apps/discord/README.md).");
/** Server mode needs Discord's Message Content intent, switched on in the Developer Portal. */
const serverMode = process.env.WARD_SERVER_MODE !== "off";
const ALERTS = "ward-alerts";
const VIEWER = "https://github.com/MuhammadMurtuzaHussain/ward/blob/main/viewer/ward-viewer.html";

let judges: Judge[] = [];
const ephemeral = MessageFlags.Ephemeral;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, ...(serverMode ? [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] : [])],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async (c) => {
  if (process.env.WARD_LITE !== "off") {
    try {
      await loadLite();
      judges = [new WardLiteJudge()];
    } catch (e) {
      console.warn("Ward Lite didn't load; reading with the word lists only.", (e as Error).message);
    }
  }
  console.log(`Ward is up as ${c.user.tag}: ${judges.length ? "word lists + Ward Lite" : "word lists"}, server mode ${serverMode ? "on" : "off"}.`);
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
  const r = await read(m.content, m.author.username, m.createdAt, judges);
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
  const lines = region
    ? [`**${region.name}** · emergency: **${region.emergency}**`, ...region.lines.map((l) => `• **${l.name}**: ${l.number}. ${l.note}`)]
    : REGIONS.map((r) => `**${r.name}**: ${r.lines.map((l) => `${l.name} ${l.number}`).join(" · ")} · emergency ${r.emergency}`);
  lines.push(`• Anywhere else: **${ELSEWHERE.name}**, ${ELSEWHERE.url}. ${ELSEWHERE.note}`);
  lines.push(`• **${TAKE_IT_DOWN.name}**: ${TAKE_IT_DOWN.url}. ${TAKE_IT_DOWN.note}`);
  lines.push("• Discord's own safety help: https://discord.com/safety");
  lines.push("\nTalking to someone isn't telling on anyone. It's getting backup.");
  await i.reply({ content: lines.join("\n").slice(0, 2000), flags: ephemeral });
}

async function onServer(i: ChatInputCommandInteraction) {
  const alerts = i.guild?.channels.cache.find((c) => c.name === ALERTS && c.type === ChannelType.GuildText) as TextChannel | undefined;
  const status = !i.guild
    ? "Ward isn't added to this server, so server mode is off here. Personal mode (right-click → Apps) still works for you."
    : alerts
      ? `Server mode is **on** here: dangerous messages go to <#${alerts.id}>.`
      : `Server mode is **off** here. To switch it on, create a private text channel called **#${ALERTS}** that only moderators and Ward can see.`;
  await i.reply({
    flags: ephemeral,
    content: [
      status,
      "",
      "**What server mode does**",
      "• Reads new messages as they arrive, with the same open engine as the app. Nothing is stored or logged.",
      `• Dangerous messages (threats, urging self-harm, sexual pressure, threats to share private images or details) go to #${ALERTS} with a link, so a person decides what to do. Ward never deletes, mutes or bans.`,
      "• The sender of a hurtful message gets a private nudge to edit or delete it. Add `ward: no-nudge` to the alerts channel's topic to turn this off.",
      "• The person it was aimed at (by mention or reply) gets a private, kind check-in. Add `ward: no-checkin` to the topic to turn this off.",
      serverMode ? "" : "\n_This copy of Ward runs with server mode switched off by whoever hosts it._",
    ].join("\n"),
  });
}

client.on(Events.InteractionCreate, async (i) => {
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
    console.error("interaction failed:", (e as Error).message);
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
  const r = await read(m.content, m.author.username, m.createdAt, judges);
  if (r.severity === 0) return;
  const topic = alerts.topic?.toLowerCase() ?? "";
  const kinds = r.categories.map((c) => CATEGORY[c]).join(", ");

  if (r.dangerous) {
    await alerts.send({
      embeds: [
        {
          title: `${VERDICT[r.severity]} in #${m.channel.name}`,
          description: `> ${m.content.slice(0, 1500).replace(/\n/g, "\n> ")}`,
          color: 0xe05c5c,
          fields: [
            { name: "From", value: `${m.author} (@${m.author.username})`, inline: true },
            { name: "Kind", value: kinds || "flagged by Ward Lite", inline: true },
            { name: "Message", value: m.url },
            { name: "Why", value: (r.why || "—").slice(0, 1024) },
          ],
          footer: { text: "Ward never acts on its own. A person decides. Ward can be wrong." },
        },
      ],
      allowedMentions: { parse: [] },
    });
  }

  if (r.severity >= 2 && !topic.includes("ward: no-nudge") && due(lastNudge, `${m.guildId}:${m.author.id}`, 10 * 60_000)) {
    await m.author
      .send(
        `Hey, Ward here (the helper in **${m.guild.name}**). Your message in #${m.channel.name} might land harder than you meant${kinds ? ` (${kinds})` : ""}. You can still edit or delete it: ${m.url}\nIf something's going on with you, \`/ward help\` has people to talk to.`,
      )
      .catch(() => {});
  }

  if (r.severity >= 2 && !topic.includes("ward: no-checkin")) {
    const replyTo = m.reference?.messageId ? await m.channel.messages.fetch(m.reference.messageId).catch(() => null) : null;
    const targets = new Map<string, User>();
    for (const u of m.mentions.users.values()) if (!u.bot && u.id !== m.author.id) targets.set(u.id, u);
    if (replyTo && !replyTo.author.bot && replyTo.author.id !== m.author.id) targets.set(replyTo.author.id, replyTo.author);
    for (const u of targets.values()) {
      if (!due(lastCheckIn, `${m.guildId}:${u.id}`, 60 * 60_000)) continue;
      await u
        .send(
          `Hi, Ward here (the helper in **${m.guild.name}**). Someone sent something rough your way in #${m.channel.name}. It isn't your fault.\n• To keep proof: right-click the message → **Apps** → **Save as evidence**.\n• \`/ward help\` lists free, private people to talk to.\n• The server's moderators ${r.dangerous ? "have been told" : "can help"}.`,
        )
        .catch(() => {});
    }
  }
}

if (serverMode) client.on(Events.MessageCreate, (m) => void onMessage(m).catch((e) => console.error("message check failed:", (e as Error).message)));

process.on("SIGTERM", () => void client.destroy().then(() => process.exit(0)));
await client.login(token);
