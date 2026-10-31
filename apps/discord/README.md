# Ward for Discord

A friendly ghost in Discord for teens dealing with bullying. It runs the same open engine as the
Ward app (word lists for English, Roman Urdu, Hinglish and Bangla, plus the Ward Lite model on
the CPU), with no closed AI service anywhere.

Discord is for people 13 and over, so this is Ward for its 14 to 17 band (and 13 year olds).

## What it does

**Personal mode** (a teen installs Ward to their own account; works in every server and DM):

- **Right-click a message → Apps → Check with Ward.** Is it bullying, what kind, and what to do
  on Discord: save proof, report, block, who to tell. Only the teen sees the answer.
- **Right-click → Apps → Save as evidence.** Ward DMs the teen a copy with a SHA-256
  fingerprint taken at that moment (the same `sender|time|text` fingerprint the app's vault
  takes). The DMs are the evidence store: no database, and nobody can edit a message Ward sent.
- **`/ward report`.** Builds a [`ward.report/v2`](../../docs/REPORT.md) from everything the teen
  saved, and DMs them `ward-report.json`. A counsellor (Ward's counsellor mode) or helpline (the
  [case viewer](../../viewer/ward-viewer.html)) can check every message wasn't changed.
- **`/ward help`.** Free, private helplines by country, Take It Down, and Discord's safety centre.

**Server mode** is a moderator tool, **off by default**. The Ward app never alerts adults; server
mode does, so it has its own policy ([SAFEGUARDING.md section 13](../../docs/SAFEGUARDING.md#13-ward-for-discord))
and needs a safeguarding review before it's offered to anyone publicly. It runs only when the host
sets `WARD_SERVER_MODE=on`, and then only in a server whose moderators create a private
`#ward-alerts` channel that only they and Ward can see. Without the setting, Ward doesn't ask
Discord for the Message Content intent and can't read server messages at all.

- Dangerous messages (threats, urging self-harm, sexual pressure, threats to share private images
  or details) go to `#ward-alerts` with a link. For self-harm, or when Ward can't tell the kind,
  the alert has the link, channel and kind only, never the words or the sender: it may be someone
  asking for help. A person decides. Ward never deletes, mutes or bans.
- Before any nudge or check-in, Ward checks whether the writer is telling what happened to them
  ("someone told me to kys", "usne mujhe bola", "আমাকে বলেছে") or standing up for someone ("stop
  telling Sara to kys"). Then nobody gets a DM, and a dangerous one reaches moderators only as
  "someone may need support", with the link and without the writer's name. Because that hides
  who wrote it, the check is narrow: a bare "someone said", or quotation marks alone, don't count,
  and nor does a message that also says "you" ("tu", "তোকে") or "or else" ("warna", "নইলে"),
  because that is how threats read. Those alert as usual, but if they might be a report, the
  writer still never gets a nudge.
- The sender of a hurtful (not dangerous) message gets a private nudge to edit or delete it
  (`ward: no-nudge` in the channel topic turns this off). Never for a dangerous message: it would
  tip off someone making threats.
- Whoever it was aimed at, by mention or reply, gets a short, kind check-in (`ward: no-checkin`
  turns this off).
- `/ward server` explains all this to moderators and gives them a notice to pin for members.

## What it keeps

Nothing. No database, no message logs (it logs errors, its own start-up line, and what it did,
never what anyone wrote). Personal mode reads only the message a teen picks; Discord sends it with
the command. Server mode, where it's on, reads messages in servers that created `#ward-alerts`, in
memory, and forgets them. Its alerts are ordinary Discord messages, though: they stay in
`#ward-alerts` until a moderator deletes them.

Unlike the Ward app, the bot does run on someone's computer, not the teen's phone: whoever hosts
it. That's why it's open source and one command to self-host. A school or a server can read the
code and run its own copy.

## Run your own

1. **Create the app** at <https://discord.com/developers/applications> → New Application.
   - **Installation:** tick **User Install** and **Guild Install**. Under Default Install
     Settings, Guild Install scopes: `applications.commands`, `bot`; permissions: *View
     Channels*, *Send Messages*, *Embed Links*, *Read Message History*. User Install scope:
     `applications.commands`.
   - **Bot:** reset the token and copy it. Only if you run server mode (see above), switch on
     **Message Content Intent**. Leave *Public Bot* on if anyone may install it.
   - Copy the **Application ID** from General Information.
2. **Configure:** `cp apps/discord/.env.example apps/discord/.env` and fill in `DISCORD_TOKEN`
   and `DISCORD_APP_ID`. Never commit `.env`.
3. **Register the commands** (once, and after changing `src/commands.ts`):
   `pnpm --filter @ward/discord register`
4. **Start it:** `pnpm --filter @ward/discord start`
5. **Install it:** the Installation page's install link. Pick *Try it now* / *Add to My Apps*
   for personal mode, or *Add to Server* for server mode.

Commands can take a few minutes to appear the first time.

**On Render:** [`render.yaml`](../../render.yaml) at the repo root describes a background worker.
New → Blueprint → this repo, then set `DISCORD_TOKEN` and `DISCORD_APP_ID` in the dashboard. The
blueprint pins `WARD_SERVER_MODE=off`, so a public instance runs personal mode only.

Server mode sends one nudge per sender every 10 minutes and one check-in per person every hour,
so a burst of messages isn't a burst of DMs. While testing, set `WARD_NUDGE_MINUTES=0` and
`WARD_CHECKIN_MINUTES=0`, or it will look as if Ward stopped after the first one. The bot logs
what it did (never what anyone wrote) to the terminal.

**Context.** Ward Lite reads one message at a time, so on its own it can mistake "I'll find you at
the fair" for a threat. When only Ward Lite flagged a message, the bot reads the eight messages
before it (where it can see the channel): if nothing around it backs the flag up, Ward says it
isn't sure and server mode stays quiet. If the host runs Gemma through Ollama
(`WARD_GEMMA_MODEL=gemma4:e4b`), Gemma takes a second look with that context and can clear false
alarms; on the everyday and red-team sets it cleared 22 of 24 false alarms and 2 of 46 hurtful
messages, and no dangerous ones ([eval/secondlook](../../eval/secondlook/results.md)).

`WARD_SERVER_MODE=on` switches server mode on (it's off otherwise, with no Message Content intent).
`WARD_LITE=off` reads with the word lists only.

## Develop

```bash
pnpm --filter @ward/discord test       # engine readings, evidence round trip, report verifies, server mode
pnpm --filter @ward/discord typecheck
```
