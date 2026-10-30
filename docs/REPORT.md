# The Ward report format (`ward.report/v2`)

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
| `schema` | `"ward.report/v2"`. Older reports say `"ward.report/v1"`; see [Versions](#versions). |
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
| `integrity` | `savedAt` (when the evidence went into the vault), `algorithm`, and `digest`: SHA-256 over the whole report, the child's answers included (see below). |
| `tool` | Ward's version, the model(s) that read the chat, and the slang packs used. |

## Checking a report

The easy way: open [`viewer/ward-viewer.html`](../viewer/ward-viewer.html), the Ward case viewer.
It's one file with no dependencies and no network access (its content-security policy blocks
every request), so a caseworker can save it, double-click it and drop a `ward-report.json` on it,
offline. It checks the digest and every message's fingerprint, then lays the case out for intake:
safety first, what the child wants, the accounts, the patterns and every message. It can copy a
plain-text case summary, download the messages as CSV (with spreadsheet formulas neutralised) or
print. It also ships inside every Ward build as `ward-viewer.html`.

By hand: recompute the digest and compare. In JavaScript, with the same function Ward uses
(`digestText` and `verifyReport` in `packages/engine/src/report.ts`):

```js
const { createdAt, recipient, tool, reporter, safety, wants, conversation, accounts, patterns, incidents } = r;
const text = JSON.stringify({ createdAt, recipient, tool, reporter, safety, wants, conversation, accounts, patterns, incidents, savedAt: r.integrity.savedAt });
sha256(text) === r.integrity.digest; // false if anything a reader relies on was edited
```

The fields go in that fixed order, so it doesn't matter how a system re-orders the top level of
the file. Inside each field, keep the order and values exactly as received (parse, don't rebuild).
The digest covers the child's own answers (`safety.inDangerNow`, `wants`, `recipient`,
`reporter`) as well as the messages, so nobody can quietly change "in danger now" from yes to no.

Each message fingerprint is `sha256(sender + "|" + ISO time + "|" + text)` at the moment it was
saved. What the fingerprints prove: the messages weren't changed after the child saved them.
What they don't prove: that the chat export itself was genuine. For that, a caseworker can ask
the child to show the conversation in WhatsApp.

## Versions

| Version | Digest covers |
| --- | --- |
| `ward.report/v2` (current) | Everything above except the digest itself: when it was made, who it's for, the tool, the child's details and answers, safety, wishes, conversation facts, accounts, patterns, every incident, and `savedAt`. |
| `ward.report/v1` (October 2026) | Only `JSON.stringify({ conversation, incidents })`. The child's answers could be edited without the check noticing. |

Ward, the case viewer and counsellor mode all still open and check v1 reports, and say plainly
that the check doesn't cover the child's answers, so a caseworker confirms those with the child.

## What's deliberately not in it

- The full chat. Only the hurtful messages go in; the rest of the conversation stays private.
- Messages the child sent, and messages from people who weren't hurtful (including anyone who
  stood up for them).
- Any guess at who is behind an anonymous account.
