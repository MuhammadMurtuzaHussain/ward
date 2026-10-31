# Ward scorecard

200 messages per language, half abusive and half not by each dataset's own labels, same sample for every system (seed 26).
Apple M-series laptop, Ollama, nothing sent off the machine. Each row says when it was run, and on which engine commit (the word lists and Gemma's prompt): `pnpm eval -- --only=...` reruns some systems and keeps the others.

Recall is the share of abusive messages caught. Precision is the share of flags that were right. In brackets: the 95% interval (Wilson for recall and precision, 2,000 bootstrap resamples of the messages for F1). With 100 messages on each side, two systems whose intervals overlap may not really differ.

† In distribution: Ward Lite was trained on the train split of the same dataset (never these test messages). The other systems never saw it. Bangla is the out-of-distribution check for Ward Lite.

## Roman Urdu

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy | Run |
| --- | --- | --- | --- | --- | --- |
| Slang packs | 59% (49–68) | 94% (85–98) | 0.72 (0.64–0.80) | 78% | 2026-10-31 `e547279` |
| ShieldGemma 2B | 14% (9–22) | 70% (48–85) | 0.23 (0.13–0.33) | 54% | 2026-10-31 `e547279` |
| Gemma 4 E4B | 88% (80–93) | 84% (76–90) | 0.86 (0.80–0.91) | 86% | 2026-10-31 `e547279`, 1 unanswered |
| Gemma 4 E2B | 30% (22–40) | 71% (56–83) | 0.42 (0.31–0.52) | 59% | 2026-10-31 `e547279`, 120 unanswered |
| Ward Lite † | 79% (70–86) | 90% (82–95) | 0.84 (0.78–0.89) | 85% | 2026-10-31 `e547279` |
| Phone: packs + Ward Lite † | 83% (74–89) | 86% (78–92) | 0.85 (0.79–0.90) | 85% | 2026-10-31 `e547279` |

## Bangla

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy | Run |
| --- | --- | --- | --- | --- | --- |
| Slang packs | 10% (6–17) | 83% (55–95) | 0.18 (0.08–0.27) | 54% | 2026-10-31 `e547279` |
| ShieldGemma 2B | 14% (9–22) | 93% (70–99) | 0.24 (0.14–0.34) | 56% | 2026-10-31 `e547279` |
| Gemma 4 E4B | 67% (57–75) | 77% (67–85) | 0.72 (0.63–0.79) | 74% | 2026-10-31 `e547279`, 18 unanswered |
| Gemma 4 E2B | 26% (18–35) | 65% (50–78) | 0.37 (0.26–0.48) | 56% | 2026-10-31 `e547279`, 120 unanswered |
| Ward Lite | 40% (31–50) | 78% (65–88) | 0.53 (0.43–0.62) | 65% | 2026-10-31 `e547279` |
| Phone: packs + Ward Lite | 46% (37–56) | 79% (67–88) | 0.58 (0.48–0.67) | 67% | 2026-10-31 `e547279` |

## English

| System | Caught (recall) | Right when it flags (precision) | F1 | Accuracy | Run |
| --- | --- | --- | --- | --- | --- |
| Slang packs | 10% (6–17) | 91% (62–98) | 0.18 (0.09–0.28) | 55% | 2026-10-31 `e547279` |
| ShieldGemma 2B | 19% (13–28) | 73% (54–86) | 0.30 (0.20–0.41) | 56% | 2026-10-31 `e547279` |
| Gemma 4 E4B | 36% (27–46) | 65% (52–77) | 0.46 (0.36–0.56) | 59% | 2026-10-31 `e547279`, 52 unanswered |
| Gemma 4 E2B | 31% (23–41) | 69% (54–80) | 0.43 (0.32–0.53) | 59% | 2026-10-31 `e547279`, 40 unanswered |
| Ward Lite † | 84% (76–90) | 67% (58–74) | 0.74 (0.68–0.80) | 71% | 2026-10-31 `e547279` |
| Phone: packs + Ward Lite † | 85% (77–91) | 67% (58–75) | 0.75 (0.68–0.81) | 72% | 2026-10-31 `e547279` |

## Systems

- **Slang packs**: Ward's word lists alone: no model, works on any phone
- **ShieldGemma 2B**: Google's open safety classifier, harassment policy
- **Gemma 4 E4B**: Ward's judge prompt (the computer tier's model), 20 unrelated messages per request with no chat context around them; any it skips are asked again in groups of 5
- **Gemma 4 E2B**: The same prompt on the phone-sized Gemma 4, 5 messages per request (it loses track of longer lists), skipped ones asked again; scored through Ollama, on a phone it runs through LiteRT-LM. Ollama gives it no structured output here, so it answers in plain JSON, and one malformed entry loses its whole request
- **Ward Lite**: The small classifier distilled for any phone (train/), int8 ONNX, flagged when hurtful or dangerous >= 0.5. Trained on the train splits of the Roman Urdu and English datasets below (never their test messages), so those two rows are in distribution; its Bangla came from other datasets
- **Phone: packs + Ward Lite**: What a phone without a big model does: a message counts if the word lists or Ward Lite flag it (Ward Lite can only add)

"Unanswered" counts messages a Gemma model returned no verdict for even after being asked again; they count as not flagged, as in the app.

## Datasets

- Roman Urdu: [community-datasets/roman_urdu_hate_speech](https://huggingface.co/datasets/community-datasets/roman_urdu_hate_speech), Coarse_Grained validation split (Abusive/Offensive vs Normal).
- Bangla: [yamin401533/bangla-cyberbullying-blindspot](https://huggingface.co/datasets/yamin401533/bangla-cyberbullying-blindspot), test split, labels Personal and Gender abusive vs Non-abusive (political and geopolitical rants left out, as they aren't aimed at a person).
- English: [surrey-nlp/Cyberbullying-Detection-CB1](https://huggingface.co/datasets/surrey-nlp/Cyberbullying-Detection-CB1), test split, classes not_cyberbullying vs gender and other_cyberbullying.

These are public social-media datasets with noisy labels, not children's chats. They test language coverage; the pattern engine (pile-ons, repeated targeting, ghost accounts) is tested on the chats in packages/engine/fixtures.
