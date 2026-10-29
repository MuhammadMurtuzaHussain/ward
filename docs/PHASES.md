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
| **Gemma 4 E2B on capable phones** | A native Android plugin running Gemma 4 E2B through LiteRT-LM (2 GB, downloaded by choice, phones with 6 GB+ RAM) | Runs on the CI emulator; measured on a real phone |

**Phase 1 results (2026-10-29).** Ward Lite shipped: 37.7 MB, 8 ms per message, raise-only. On
the scorecard a phone now catches 85% of Roman Urdu abuse (word lists alone: 59%) and 83% of
English (10%); Bangla is at 39% (10%), and needs more real non-abusive Bangla chat. Gemma 4 E2B
scored about a third even with 5 messages per request, so it doesn't judge chats: on phones it
writes (the message to a trusted adult, feedback on lesson answers). Still to do: measure both
on a real low-end phone, and grow the Bangla data.

## Phase 2: every child can use it

| Piece | What | Done when |
| --- | --- | --- |
| **Shared-phone mode** | Profiles on one device, each behind its own PIN; no message text in any preview; a quick-exit button | Two profiles on one phone can't see each other's checks, vault or progress |
| **Read-aloud** | On-device text-to-speech for every screen and lesson, Urdu included; voice input for written answers | Every lesson can be completed without reading |
| **Urdu UI** | Full interface in Urdu script with right-to-left layout, then Hindi, Bangla, Pashto, Sindhi, Punjabi (Shahmukhi) | All strings in translation files; no hard-coded English |
| **Quiet mode** | A neutral app name and icon, for children whose risk is at home | Only after a safeguarding reviewer signs off |

**Phase 2 results (2026-10-29).** Shared-phone mode shipped: profiles with their own progress,
settings and vault database, an optional PIN (salted PBKDF2 hash), and quick exit from every
screen (a button, or Escape twice) that locks Ward and, on Android, sends it to the background;
the window is FLAG_SECURE so it never shows in the recents preview. The whole interface and all
seven units of lessons are in Urdu, right to left, in Noto Nastaliq Urdu, with Gemma writing its
notes in Urdu too. Read-aloud is on by default for the youngest band: 107 English lines
(onboarding, verdicts, coach steps, every lesson prompt and explanation) are recorded with
ElevenLabs and bundled offline; Urdu uses the device's Urdu voice for now. Still to do: record
the Urdu clips (about 9,000 characters; the script and voice are chosen), voice input for
written answers, a native Urdu speaker's review, and the next languages.

## Phase 3: the whole picture, not only the victim

| Piece | What | Done when |
| --- | --- | --- |
| **"Was I mean?"** | A non-judgemental self-check for a child worried they went too far, leading to repair lessons | Content reviewed; never shames, never stores |
| **Help a friend** | "Checking for a friend" becomes a full upstander flow: how to reach out, what to say, how to bring in an adult without breaking trust | A complete path from check to action |
| **Stories** | Branching interactive stories with recurring characters that grow with the age bands | One story per unit per age band |
| **Lessons that respond** | After a check, Ward suggests the lessons that fit what happened; streaks never guilt-trip | Suggestions shown after checks |
| **Safety plan** | A teen safety plan (warning signs, things that help, people, safe places) kept in the vault, one tap from any urgent result | Reviewed by a professional before release |

**Phase 3 progress (2026-10-29).** Four of five pieces shipped, in English and Urdu:
- **Lessons that respond:** every result and coach screen ends with up to three lessons chosen
  from what Ward found (exclusion, a pile-on, photo pressure, late nights, a friend's chat),
  for the child's age, new ones first. No streak pressure.
- **Help a friend:** a check done "for a friend" now gets its own coach: a private message to
  them (three lines to copy), don't join in or fight back, keep the proof, report anonymously,
  and bringing in an adult without going behind their back, unless they're in danger.
- **"Was I mean?":** five private questions, nothing stored, never the word "bully"; then either
  reassurance or five repair steps with apologies to copy, and two lessons. A result also says,
  gently, when the child's own messages could land hard, and links here.
- **Safety plan:** five short sections with tap-to-add ideas, sealed in the vault under the same
  PIN, autosaved, with the country's helplines below. Shown to the 14 to 17 band, on Home, in the
  Vault and under any urgent result about their own chat. Still needs the professional review
  before it is turned on more widely.

Also fixed on the way: vault connections now close after each transaction, so "delete
everything" really deletes the vault database instead of waiting for a reload.

Still to do: branching stories.

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

## Partner technologies

Ward's rule is that a child's messages never leave their device, so partner services are used to
**build, evaluate, host static content and keep instructions current**, never to read a chat.

| Partner | Where it helps Ward | Phase | Status |
| --- | --- | --- | --- |
| **Gemma** | Everything that reads: Gemma 4 E4B on computers, Gemma 4 E2B on phones (LiteRT-LM), Gemma 4 as the teacher that writes and labels Ward Lite's training data, ShieldGemma as the baseline | 1 | In use |
| **ElevenLabs** | Read-aloud: lesson narration and the adult guide pre-recorded in English and Urdu, shipped as audio files inside the app (static text, no child data); Ward's voice for the youngest band | 2 | English shipped (107 clips); Urdu next |
| **DigitalOcean** | A GPU droplet for the heavy, data-free jobs: generating and labelling synthetic chats with Gemma 4 at scale, training a larger teacher before distilling, and rerunning the scorecard on every release | 1, 5 | Planned |
| **Render** | Hosting the static pieces: a try-it-in-the-browser demo (runs entirely client-side), the caseworker viewer, and the docs | 4 | Planned |
| **Browserbase + SerpApi** | A weekly job that finds the official report/block help pages for WhatsApp, Instagram, TikTok, Snapchat and Discord and checks they still match the Coach's steps, opening an issue when an app changes its menus | 4 | Planned |
| **Entire** | Checkpoints of these agent sessions with the code, so how Ward was built can be audited and replayed | All | To enable |
| **Auth0 for AI Agents** | Logins for vetted Ward Annotate volunteers (adults only, synthetic and public data only) | 5 | Later |
| **Tiger Data** | Scorecard and red-team history across releases, so regressions in any language are visible | 5 | Later |
| **Temporal** | Making the distillation pipeline (generate, label, leak-check, train, gate, export) durable and resumable when it runs for hours on a GPU droplet | 5 | Later |

Not used, on purpose: services that would store or process a child's chats or memories in the
cloud. Tinker would have fit Phase 1 fine-tuning, but credits ran out; Ward Lite trains on a
laptop instead (an M-series Mac fine-tunes it in minutes).
