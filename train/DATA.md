# Ward Lite training data

Built by `build-data.ts`. 28747 messages after removing duplicates, **98 that also appear in the scorecard's eval sets** and **122 that match or nearly match the everyday false-alarm set** (both dropped so those tests stay honest). 90% train, 10% dev (for choosing the checkpoint; the scorecard is separate).

## Sources

- **Roman Urdu (roman_urdu_hate_speech, train)**: 7208 rows before dedupe
- **English (Cyberbullying-Detection-CB1, train)**: 6000 rows before dedupe
- **Hinglish and Hindi (prism-hinglish-hate-speech, train)**: 6000 rows before dedupe
- **Bangla (mteb/bengali_hate_speech, personal and gender labels)**: 877 rows before dedupe
- **Bangla non-abusive (SentNoB, neutral and positive comments)**: 2500 rows before dedupe
- **Synthetic chats (Gemma 4 on this machine)**: 3743 rows before dedupe
- **Synthetic hard negatives and intent-only threats (Gemma 4 on this machine)**: 1737 rows before dedupe
- **Contrast templates (gen-contrast.ts, hand-written)**: 1160 rows before dedupe

The scorecard's own splits (Roman Urdu validation, Bangla blindspot test, CB1 test) are never used for training.

The red-team set (`eval/redteam/`, see [docs/REDTEAM.md](../docs/REDTEAM.md)) is a test set too. **Nothing in `train/` may read `eval/redteam/`**, and no red-team message may be copied or paraphrased into training data or the synthetic-data prompts. `eval/redteam/leak.test.ts`, part of `pnpm test`, fails if any red-team text turns up in `train/data` or the training scripts, or if code here opens that folder.

## Labels

- **hurtful**: the dataset's own abusive/bullying label, or the kind the synthetic message was written as.
- **danger**: threats, telling someone to hurt themselves, sexual pressure, or threats to expose. From the synthetic kind, or (for public data) a severity-3 slang-pack hit, which is a weak label.

| Language | Messages | Hurtful | Danger |
| --- | --- | --- | --- |
| ur-Latn | 8768 | 4212 | 591 |
| en | 7368 | 3829 | 613 |
| hi | 4039 | 2097 | 0 |
| hi-Latn | 3498 | 1748 | 569 |
| bn | 5074 | 1719 | 569 |

## Hard negatives and intent-only threats (added 2026-10-31)

The first Ward Lite scored "see you tomorrow" as 0.99 dangerous. The synthetic threat batches were
full of "later", "tomorrow", "after school" and "meet me", and almost nothing friendly used those
words, so the model learned the words instead of the intent. Two kinds of data fix that:

- **Friendly messages that share threat words** (hurtful 0, danger 0): goodbyes and plans ("see
  you after tuition", "kal milte hain", "কাল দেখা হবে"), caring offers ("I'll get you a samosa",
  "wait there I'm coming"), and game trash talk that names the game. Gemma 4 kinds `plans`,
  `caring`, `gaming`, plus hand-written templates in `gen-contrast.ts`.
- **Threats that rely on intent** (hurtful 1, danger 1): violence, self-harm urging, blackmail and
  sexual pressure. Gemma 4 kinds `threat-intent` and `coercion` were asked for no time or
  meeting words, and 13 that used them anyway were dropped. The templates write most
  threats with no time words and about a third starting with the same time and meeting phrases as
  the friendly templates ("see you tomorrow, I'm going to break your teeth"), so those phrases
  appear on both sides and only the intent decides.

Templates use the same names, punctuation, casing and emoji on both sides, so none of those can
become the next shortcut.

| Language | Friendly (Gemma) | Friendly (templates) | Threats (Gemma) | Threats (templates) |
| --- | --- | --- | --- | --- |
| ur-Latn | 262 | 162 | 165 | 120 |
| en | 262 | 162 | 170 | 120 |
| hi | 0 | 0 | 0 | 0 |
| hi-Latn | 254 | 162 | 165 | 114 |
| bn | 258 | 148 | 166 | 114 |

**Held out:** the everyday false-alarm set (`eval/everyday/everyday.jsonl`, 329 friendly
messages written separately, never shown to the generators) is checked against every training
row, not only the new ones: exact match, word overlap (Jaccard >= 0.6), or containing a whole
everyday message of three or more words drops the training row. `score-everyday.py` reports how
often the exported model flags that set.

## Known weaknesses

- Public data is tweets and comments, not children's chats; synthetic chats fill that gap but were written by a model.
- Bangla non-abusive examples are SentNoB comments (neutral and positive sentiment), which are a different source from the abusive Bangla rows; the model could partly learn source style rather than abuse.
- The danger label on public data is weak (slang-pack hits only).
