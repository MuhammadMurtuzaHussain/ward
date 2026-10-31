# Seed issues (drafts)

> **Drafts, not yet opened on GitHub.** These are first issues for new contributors, written so a
> maintainer can copy each one into a new issue. Each is small, has a clear "done", and needs no
> access to real children's data. Suggested labels are given, but the labels may not exist yet.

Every issue opened from this file should keep the line: **Never paste a real child's chat, name,
photo, school or phone number in this issue or its pull request.**

---

## 1. Spaced-out "k y s" slips past the word lists

**Labels:** `good first issue`, `slang-pack`, `engine`

The joining rule in `normalize()` only joins single letters separated by spaces when there are
four or more, so "k y s" (telling someone to kill themselves) is never matched, and neither the
word lists nor Ward Lite flag it ([docs/REDTEAM.md](REDTEAM.md), item `en-004`). Three-letter
joining would also join harmless runs like "i m ok", so the fix needs care.

**Done when:** a spaced self-harm initialism of three letters is matched, an engine test shows
it, and a test shows ordinary three-letter runs ("i m ok", "u r ok") are not flagged. Don't add
the red-team message itself to any test or pack; write your own examples.

**Files:** `packages/engine/src/normalize.ts`, `packages/engine/src/engine.test.ts`.

## 2. Wilson intervals on the scorecard and red-team tables

**Labels:** `good first issue`, `eval`

The red-team set has 14 to 36 messages per language and side, and some cells have 2. A
percentage with no interval reads as more certain than it is.

**Done when:** the tables written by `eval/redteam/run.ts` (and, if simple, `eval/run.ts`) show a
95% Wilson interval next to each rate, and the method section says what the interval means.
No numbers change otherwise.

**Files:** `eval/redteam/run.ts`, `eval/run.ts`.

## 3. Review the Bangla slang pack (native speaker wanted)

**Labels:** `help wanted`, `slang-pack`, `language:bn`

`packages/engine/packs/bn.json` has 30 entries in Bangla script and romanised Bangla, written by
someone who does not speak Bangla natively. It has never been reviewed.

**Done when:** a Bangla speaker has gone through every entry and said, in the issue or a pull
request, whether its meaning, category and severity are right, which ones are also everyday words
(and so cause false alarms), and which common words are missing. Changes go in through the
[slang-pack review](../CONTRIBUTING.md#how-slang-pack-changes-are-reviewed).

## 4. Review the Urdu lessons and stories (native speaker wanted)

**Labels:** `help wanted`, `translation`, `language:ur`

The Urdu lessons and stories (`packages/lessons/src/units.ur.ts`, `stories.ur.ts`) and the Urdu
interface (`apps/web/src/i18n/ur.ts`) were written without a native speaker's review.

**Done when:** a reviewer has read one unit (say, *Spot it*) in all three age bands and listed
anything unnatural, too formal for a child, or that could carry an unintended meaning, with
suggested fixes. One unit per issue is fine; open another for the next.

## 5. Helpline numbers: a source and a date for every entry

**Labels:** `good first issue`, `helpline`

Helplines live in `apps/web/src/lib/help.ts`. The file says they were checked on 2026-10-29, but
individual entries don't say where each number came from.

**Done when:** each `HelpLine` has a `source` (a URL) and a `verifiedAt` date, a test fails if
either is missing, and the existing numbers are filled in from the sources they were checked
against. No number changes in this issue unless a source shows it is wrong (then say so in the
pull request).

**Files:** `apps/web/src/lib/help.ts`, `apps/web/src/lib/help.test.ts`.

## 6. Emoji stand-ins for appearance insults

**Labels:** `slang-pack`, `engine`, `proposal`

Animal emoji used as insults (🐷, 🐘, 🐒, 🐄) get past every phone layer
([docs/REDTEAM.md](REDTEAM.md), item 8). They are also used kindly all the time, so a plain
word-list entry would cause many false alarms.

**Done when:** there is a short written proposal in the issue for how Ward could treat an emoji
aimed at a person (for example, only next to "dekho", "look at" or a name), with made-up examples
on both sides, and a maintainer has agreed or declined. Code can follow in another issue.

## 7. Hinglish pack: add common words, with false-alarm notes

**Labels:** `help wanted`, `slang-pack`, `language:hi-Latn`

`packages/engine/packs/hi-Latn.json` has only 19 entries. The red-team set shows common
initialisms and insults it misses.

**Done when:** a Hinglish speaker proposes up to 15 words children actually use, each with a
meaning, category, severity and a note on whether it is used kindly between friends, and a second
speaker has reviewed them. Don't take words from the red-team set or the scorecard's test data.

## 8. Run the Urdu read-aloud on a real Android phone

**Labels:** `help wanted`, `accessibility`, `android`

Urdu read-aloud uses the device's own text-to-speech. It has not been tested inside the Android
app's WebView, where it may be silent.

**Done when:** someone has built the debug APK (see the README's [Run it](../README.md#run-it)),
switched Ward to Urdu, pressed Listen on a lesson, and reported in the issue the phone model,
Android version, and whether it spoke, with no screenshots of real chats.

## 9. Check Ward with a screen reader

**Labels:** `help wanted`, `accessibility`

Nobody has used Ward with TalkBack, VoiceOver or NVDA from start to finish.

**Done when:** someone has gone through onboarding, one check of a made-up chat, and one lesson
with a screen reader, and listed in the issue every place where focus got lost, a button had no
name, or feedback was silent. Fixes can be separate issues.

---

## Not seed issues

Some open work is not suitable for a first contribution, because it needs a decision from the
project's owner or a qualified person: the content licence, the safeguarding lead, ElevenLabs'
terms, replacing the SentNoB training data, and anything that changes what Ward does when it sees
danger. Those are tracked in [DPG.md](DPG.md#placeholders-in-this-file) and
[GOVERNANCE.md](GOVERNANCE.md).
