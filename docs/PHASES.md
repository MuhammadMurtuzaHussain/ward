# Build phases

How Ward gets from the MVP to the intervention described in [ROADMAP.md](ROADMAP.md). Each
phase ships something a child, an adult or a helpline can use, with a test that says it's done.
Phases overlap; the order is by how much each closes the gap in WS05937.

## Phase 1: Ward reads well on every phone

Today a phone gets only word lists and patterns (59% of Roman Urdu abuse caught) while a
computer with Gemma 4 gets 86%. The children with the least get the weakest Ward.

| Piece | What | Done when |
| --- | --- | --- |
| **Ward Lite model** | A small multilingual classifier (about 100 MB after int8), distilled from Gemma 4 and public datasets, run in the app with ONNX Runtime Web. Works on every platform, offline, in tens of milliseconds per message. | Beats the word lists on every language in the scorecard, using only data the scorecard never sees |
| **Training data without leakage** | Public train splits only (never the eval splits), plus synthetic kid-style chats in English, Roman Urdu, Hinglish and Bangla written and labelled by Gemma 4, including friendly banter as hard negatives | A data card listing every source, split and count |
| **The safety gate** | The model can raise a message's severity, but never lowers one the word lists call dangerous; fixture chats keep their verdicts | Engine tests on every fixture |
| **Tiers** | Ward picks the strongest reader available: Gemma 4 (computer) > Gemma 3n on the phone > Ward Lite > word lists, and says which one read the chat | "How I worked this out" names the tier |
| **Gemma 3n on capable phones** | A native Android plugin running Gemma 3n through Google's on-device runtime, for phones with 4 GB+ RAM, for the close read and the explanations | Runs on the CI emulator; measured on a real phone |

## Phase 2: every child can use it

| Piece | What | Done when |
| --- | --- | --- |
| **Shared-phone mode** | Profiles on one device, each behind its own PIN; no message text in any preview; a quick-exit button | Two profiles on one phone can't see each other's checks, vault or progress |
| **Read-aloud** | On-device text-to-speech for every screen and lesson, Urdu included; voice input for written answers | Every lesson can be completed without reading |
| **Urdu UI** | Full interface in Urdu script with right-to-left layout, then Hindi, Bangla, Pashto, Sindhi, Punjabi (Shahmukhi) | All strings in translation files; no hard-coded English |
| **Quiet mode** | A neutral app name and icon, for children whose risk is at home | Only after a safeguarding reviewer signs off |

## Phase 3: the whole picture, not only the victim

| Piece | What | Done when |
| --- | --- | --- |
| **"Was I mean?"** | A non-judgemental self-check for a child worried they went too far, leading to repair lessons | Content reviewed; never shames, never stores |
| **Help a friend** | "Checking for a friend" becomes a full upstander flow: how to reach out, what to say, how to bring in an adult without breaking trust | A complete path from check to action |
| **Stories** | Branching interactive stories with recurring characters that grow with the age bands | One story per unit per age band |
| **Lessons that respond** | After a check, Ward suggests the lessons that fit what happened; streaks never guilt-trip | Suggestions shown after checks |
| **Safety plan** | A teen safety plan (warning signs, things that help, people, safe places) kept in the vault, one tap from any urgent result | Reviewed by a professional before release |

## Phase 4: the circle and the community

| Piece | What | Done when |
| --- | --- | --- |
| **Caseworker viewer** | A free, offline web page where a helpline opens `ward-report.json`, verifies the digest, reads the case and exports to intake | Opens and verifies any report Ward makes |
| **Counsellor mode** | A school counsellor's Ward that receives reports by file or QR, verifies them and keeps local case notes | No server anywhere |
| **School kit** | Printable lesson plans, a parent letter (English and Urdu), and an anonymous before/after class survey with a scoring sheet | A school can run a term and measure it alone |
| **One-click desktop** | Gemma bundled through llama.cpp inside the desktop app, no Ollama install; a lab mode that wipes itself for shared school computers | Fresh machine to first close read with one download |
| **Give Ward to a friend** | Share the app's own APK over Bluetooth or Nearby Share, no internet needed; Play Store and F-Droid listings | APK shared phone to phone in CI |

## Phase 5: proof and staying alive

| Piece | What | Done when |
| --- | --- | --- |
| **Ward Annotate** | Vetted teachers and youth volunteers label synthetic and public messages (never real children's chats) to grow the training data | First community-labelled release |
| **Red-team set** | Disguised insults, coded bullying and tricky banter, rerun on every release with the scorecard | Published per language, including failures |
| **"This is wrong"** | A correction button on every judgement; corrections stay on the device unless the child shares them | Shown on every flagged message |
| **Governance** | Safeguarding policy, language maintainers, youth advisory group, Digital Public Goods application | Policy published; application submitted |

## Phase 6: prevention at the keyboard

An opt-in Ward keyboard for Android that notices a hurtful message before it's sent and offers
a pause. Everything on the device, nothing logged. Built only after the safeguarding review in
Phase 5, because a keyboard sees everything a child types.
