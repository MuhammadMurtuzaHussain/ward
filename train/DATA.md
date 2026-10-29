# Ward Lite training data

Built by `build-data.ts`. 20498 messages after removing duplicates and **97 that also appear in the scorecard's eval sets** (dropped so the scorecard stays honest). 90% train, 10% dev (for choosing the checkpoint; the scorecard is separate).

## Sources

- **Roman Urdu (roman_urdu_hate_speech, train)**: 7208 rows before dedupe
- **English (Cyberbullying-Detection-CB1, train)**: 6000 rows before dedupe
- **Hinglish and Hindi (prism-hinglish-hate-speech, train)**: 6000 rows before dedupe
- **Bangla (mteb/bengali_hate_speech, personal and gender labels)**: 877 rows before dedupe
- **Synthetic chats (Gemma 4 on this machine)**: 680 rows before dedupe

The scorecard's own splits (Roman Urdu validation, Bangla blindspot test, CB1 test) are never used for training.

## Labels

- **hurtful**: the dataset's own abusive/bullying label, or the kind the synthetic message was written as.
- **danger**: threats, telling someone to hurt themselves, sexual pressure, or threats to expose. From the synthetic kind, or (for public data) a severity-3 slang-pack hit, which is a weak label.

| Language | Messages | Hurtful | Danger |
| --- | --- | --- | --- |
| ur-Latn | 7187 | 3344 | 16 |
| en | 6462 | 3345 | 127 |
| hi | 4039 | 2097 | 0 |
| hi-Latn | 1935 | 888 | 2 |
| bn | 875 | 875 | 0 |

## Known weaknesses

- Public data is tweets and comments, not children's chats; synthetic chats fill that gap but were written by a model.
- Bangla public data has no non-abusive rows aimed at the same topics; Bangla negatives come only from synthetic chats.
- The danger label on public data is weak (slang-pack hits only).
