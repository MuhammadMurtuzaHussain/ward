# Ward scorecard

200 messages per language, half abusive and half not by each dataset's own labels, same sample for every system (seed 26).
Run on 2026-10-29, Apple M-series laptop, Ollama, nothing sent off the machine.

Recall is the share of abusive messages caught. Precision is the share of flags that were right.

## Roman Urdu

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy |
| --- | --- | --- | --- | --- |
| Slang packs | 34% | 85% | 0.49 | 64% |
| ShieldGemma 2B | 14% | 70% | 0.23 | 54% |
| Gemma 4 E4B | 83% | 89% | 0.86 | 87% |

## Bangla

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy |
| --- | --- | --- | --- | --- |
| Slang packs | 2% | 40% | 0.04 | 50% |
| ShieldGemma 2B | 12% | 86% | 0.21 | 55% |
| Gemma 4 E4B | 33% | 67% | 0.44 | 59% |

## English

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy |
| --- | --- | --- | --- | --- |
| Slang packs | 10% | 83% | 0.18 | 54% |
| ShieldGemma 2B | 19% | 73% | 0.30 | 56% |
| Gemma 4 E4B | 22% | 71% | 0.34 | 56% |

## Systems

- **Slang packs**: Ward's word lists alone: no model, works on any phone
- **ShieldGemma 2B**: Google's open safety classifier, harassment policy
- **Gemma 4 E4B**: Ward's judge prompt, one message at a time, no chat context

## Datasets

- Roman Urdu: [community-datasets/roman_urdu_hate_speech](https://huggingface.co/datasets/community-datasets/roman_urdu_hate_speech), Coarse_Grained validation split (Abusive/Offensive vs Normal).
- Bangla: [yamin401533/bangla-cyberbullying-blindspot](https://huggingface.co/datasets/yamin401533/bangla-cyberbullying-blindspot), test split (anything but Non-abusive counts as abusive).
- English: [surrey-nlp/Cyberbullying-Detection-CB1](https://huggingface.co/datasets/surrey-nlp/Cyberbullying-Detection-CB1), test split, classes not_cyberbullying vs gender and other_cyberbullying.

These are public social-media datasets with noisy labels, not children's chats. They test language coverage; the pattern engine (pile-ons, repeated targeting, ghost accounts) is tested on the chats in packages/engine/fixtures.
