# Ward Lite training data

Built by `build-data.ts`. 25984 messages after removing duplicates and **97 that also appear in the scorecard's eval sets** (dropped so the scorecard stays honest). 90% train, 10% dev (for choosing the checkpoint; the scorecard is separate).

## Sources

- **Roman Urdu (roman_urdu_hate_speech, train)**: 7208 rows before dedupe
- **English (Cyberbullying-Detection-CB1, train)**: 6000 rows before dedupe
- **Hinglish and Hindi (prism-hinglish-hate-speech, train)**: 6000 rows before dedupe
- **Bangla (mteb/bengali_hate_speech, personal and gender labels)**: 877 rows before dedupe
- **Bangla non-abusive (SentNoB, neutral and positive comments)**: 2500 rows before dedupe
- **Synthetic chats (Gemma 4 on this machine)**: 3743 rows before dedupe

The scorecard's own splits (Roman Urdu validation, Bangla blindspot test, CB1 test) are never used for training.

The red-team set (`eval/redteam/`, see [docs/REDTEAM.md](../docs/REDTEAM.md)) is a test set too. **Nothing in `train/` may read `eval/redteam/`**, and no red-team message may be copied or paraphrased into training data or the synthetic-data prompts. `eval/redteam/leak.test.ts`, part of `pnpm test`, fails if any red-team text turns up in `train/data` or the training scripts, or if code here opens that folder.

## Labels

- **hurtful**: the dataset's own abusive/bullying label, or the kind the synthetic message was written as.
- **danger**: threats, telling someone to hurt themselves, sexual pressure, or threats to expose. From the synthetic kind, or (for public data) a severity-3 slang-pack hit, which is a weak label.

| Language | Messages | Hurtful | Danger |
| --- | --- | --- | --- |
| ur-Latn | 8062 | 3928 | 307 |
| en | 6658 | 3541 | 323 |
| hi | 4039 | 2097 | 0 |
| hi-Latn | 2806 | 1470 | 291 |
| bn | 4419 | 1447 | 289 |

## Known weaknesses

- Public data is tweets and comments, not children's chats; synthetic chats fill that gap but were written by a model.
- Bangla non-abusive examples are SentNoB comments (neutral and positive sentiment), which are a different source from the abusive Bangla rows; the model could partly learn source style rather than abuse.
- The danger label on public data is weak (slang-pack hits only).
