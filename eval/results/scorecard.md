# Ward scorecard

200 messages per language, half abusive and half not by each dataset's own labels, same sample for every system (seed 26).
Run on 2026-10-29, Apple M-series laptop, Ollama, nothing sent off the machine.

Recall is the share of abusive messages caught. Precision is the share of flags that were right.

## Roman Urdu

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy |
| --- | --- | --- | --- | --- |
| Slang packs | 59% | 94% | 0.72 | 78% |
| ShieldGemma 2B | 14% | 70% | 0.23 | 54% |
| Gemma 4 E4B | 86% | 86% | 0.86 | 86% |

## Bangla

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy |
| --- | --- | --- | --- | --- |
| Slang packs | 10% | 83% | 0.18 | 54% |
| ShieldGemma 2B | 14% | 93% | 0.24 | 56% |
| Gemma 4 E4B | 65% | 78% | 0.71 | 74% |

## English

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy |
| --- | --- | --- | --- | --- |
| Slang packs | 10% | 91% | 0.18 | 55% |
| ShieldGemma 2B | 19% | 73% | 0.30 | 56% |
| Gemma 4 E4B | 36% | 72% | 0.48 | 61% |

## Systems

- **Slang packs**: Ward's word lists alone: no model, works on any phone
- **ShieldGemma 2B**: Google's open safety classifier, harassment policy
- **Gemma 4 E4B**: Ward's judge prompt, one message at a time, no chat context (the computer tier)
- **Gemma 4 E2B**: The same prompt on the phone-sized Gemma 4 (scored through Ollama; on a phone it runs through LiteRT-LM)
- **Ward Lite**: The small classifier distilled for any phone (train/), int8 ONNX, flagged when hurtful or dangerous >= 0.5
- **Phone: packs + Ward Lite**: What a phone without a big model does: a message counts if the word lists or Ward Lite flag it (Ward Lite can only add)

## Datasets

- Roman Urdu: [community-datasets/roman_urdu_hate_speech](https://huggingface.co/datasets/community-datasets/roman_urdu_hate_speech), Coarse_Grained validation split (Abusive/Offensive vs Normal).
- Bangla: [yamin401533/bangla-cyberbullying-blindspot](https://huggingface.co/datasets/yamin401533/bangla-cyberbullying-blindspot), test split, labels Personal and Gender abusive vs Non-abusive (political and geopolitical rants left out, as they aren't aimed at a person).
- English: [surrey-nlp/Cyberbullying-Detection-CB1](https://huggingface.co/datasets/surrey-nlp/Cyberbullying-Detection-CB1), test split, classes not_cyberbullying vs gender and other_cyberbullying.

These are public social-media datasets with noisy labels, not children's chats. They test language coverage; the pattern engine (pile-ons, repeated targeting, ghost accounts) is tested on the chats in packages/engine/fixtures.
