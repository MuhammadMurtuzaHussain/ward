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

**Server mode** (opt-in per server: create a private `#ward-alerts` channel only moderators and
Ward can see):

- Dangerous messages (threats, urging self-harm, sexual pressure, threats to share private images
  or details) go to `#ward-alerts` with a link. A person decides. Ward never deletes, mutes or
  bans.
- The sender of a hurtful message gets a private nudge to edit or delete it (`ward: no-nudge` in
  the channel topic turns this off).
- Whoever it was aimed at, by mention or reply, gets a short, kind check-in (`ward: no-checkin`
  turns this off).

## What it keeps

Nothing. No database, no message logs (it logs errors and its own start-up line only). Personal
mode reads only the message a teen picks; Discord sends it with the command. Server mode reads
messages in servers that created `#ward-alerts`, in memory, and forgets them.

Unlike the Ward app, the bot does run on someone's computer, not the teen's phone: whoever hosts
it. That's why it's open source and one command to self-host. A school or a server can read the
code and run its own copy.

## Run your own

1. **Create the app** at <https://discord.com/developers/applications> → New Application.
   - **Installation:** tick **User Install** and **Guild Install**. Under Default Install
     Settings, Guild Install scopes: `applications.commands`, `bot`; permissions: *View
     Channels*, *Send Messages*, *Embed Links*, *Read Message History*. User Install scope:
     `applications.commands`.
   - **Bot:** reset the token and copy it. For server mode, switch on **Message Content
     Intent**. Leave *Public Bot* on if anyone may install it.
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
New → Blueprint → this repo, then set `DISCORD_TOKEN` and `DISCORD_APP_ID` in the dashboard.

Server mode sends one nudge per sender every 10 minutes and one check-in per person every hour,
so a burst of messages isn't a burst of DMs. While testing, set `WARD_NUDGE_MINUTES=0` and
`WARD_CHECKIN_MINUTES=0`, or it will look as if Ward stopped after the first one. The bot logs
what it did (never what anyone wrote) to the terminal.

`WARD_SERVER_MODE=off` runs personal mode only (no Message Content intent needed).
`WARD_LITE=off` reads with the word lists only.

## Develop

```bash
pnpm --filter @ward/discord test       # engine readings, evidence round trip, report verifies
pnpm --filter @ward/discord typecheck
```
