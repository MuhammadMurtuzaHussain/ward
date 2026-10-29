# The Ward report format (`ward.report/v1`)

When a child makes a report in Ward, they get two files:

- **A page** (`Ward report - <chat>.html`) for a person to read or print.
- **`ward-report.json`**, the same report as data, so a helpline or school system can import it
  and check it wasn't changed.

Both are made on the child's device. Ward never sends them; the child chooses who gets them.

This format is a draft. It was written without a helpline yet, and the first thing we want is a
helpline's caseworkers telling us what's missing or in the wrong order. See
[ROADMAP.md](ROADMAP.md).

## Why a format

Helplines spend intake time reconstructing what happened from screenshots: who, when, how often,
whether there's a threat, what the child wants. Pakistan's Digital Rights Foundation helpline
took 3,012 new complaints in 2025, with cases involving minors up 28%. A report that arrives
complete saves that time on every case.

## Fields

| Field | What it holds |
| --- | --- |
| `schema` | Always `"ward.report/v1"`. |
| `createdAt` | When the report was made (ISO 8601). |
| `recipient` | Who the child made it for: `helpline`, `school`, `police` or `adult`. |
| `reporter` | Only what the child chose to share: `firstName`, `ageBand` (`"8"` = 8 to 10, `"11"` = 11 to 13, `"14"` = 14 to 17), `city`, `country`. Empty fields are left out. |
| `safety.inDangerNow` | The child's own answer: `true`, `false`, or `null` if they skipped it. |
| `safety.level` | Ward's overall reading: `calm`, `watch`, `bullying`, `urgent`. |
| `safety.dangerous` | Any of `threat`, `selfharm`, `sexual`, `exposure` present in the messages. |
| `wants` | What the child wants to happen, e.g. `{ "id": "remove", "label": "Get something taken down" }`. |
| `conversation` | Title, platform, `source` (`whatsapp` export or `paste`), message and participant counts, first and last hurtful message, number of days. |
| `accounts` | Each account that sent hurtful messages, as named in the chat: count, worst severity, whether it was added to the group during the chat, whether it only ever attacked. |
| `patterns` | Ward's pattern findings (`campaign`, `pileon`, `ghosts`, `exclusion`, `danger`, `nightwatch`, `escalating`) with one neutral, third-person sentence each (`fact`). |
| `incidents` | Every hurtful message: time, sender, exact text, severity (1 unkind, 2 bullying, 3 dangerous), categories, Ward's short note, and its SHA-256 fingerprint. |
| `integrity` | `savedAt` (when the evidence went into the vault), `algorithm`, and `digest`: SHA-256 of `JSON.stringify({ conversation, incidents })`. |
| `tool` | Ward's version, the model(s) that read the chat, and the slang packs used. |

## Checking a report

Recompute the digest and compare. In JavaScript, with the same function Ward uses
(`verifyReport` in `packages/engine/src/report.ts`):

```js
const digest = sha256(JSON.stringify({ conversation: r.conversation, incidents: r.incidents }));
digest === r.integrity.digest; // false if any message, time or count was edited
```

Each message fingerprint is `sha256(sender + "|" + ISO time + "|" + text)` at the moment it was
saved. What the fingerprints prove: the messages weren't changed after the child saved them.
What they don't prove: that the chat export itself was genuine. For that, a caseworker can ask
the child to show the conversation in WhatsApp.

## What's deliberately not in it

- The full chat. Only the hurtful messages go in; the rest of the conversation stays private.
- Messages the child sent, and messages from people who weren't hurtful (including anyone who
  stood up for them).
- Any guess at who is behind an anonymous account.
