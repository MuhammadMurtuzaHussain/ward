# Ward: build plan

Ward is a guardian that lives on a child's own device. It helps them notice when they are being
bullied online, keeps the evidence, coaches them through what to do, and trains them to be
harder to hurt. It runs on open-weight models (Gemma, ShieldGemma) on the device, so a child's
messages never go to anyone's cloud.

Entry for the DEV Hacktoberfest Open-Source AI Challenge, Week 4 (*Ghost in the Machine*), and
an answer to World Solve problem WS05937: *Building effective interventions for cyberbullying
harming children by 2030*.

## The problem, in the problem's own terms

WS05937 asks for an intervention that:

| Criterion | How Ward meets it |
| --- | --- |
| Works where resources are scarcest | Runs offline on a cheap Android phone or an old laptop. No account, no subscription, no data plan after the first model download. Understands Roman Urdu, Hinglish and Bangla, where English safety filters go blind. |
| Clear, measurable results | `eval/` scores Ward and an English-only baseline on public datasets (Roman Urdu, Bangla, English). The numbers go in the README and the post. In the app: lessons finished, streak, evidence saved, steps taken. |
| Identifies possible harms | `docs/HARMS.md`: false positives, false negatives, a parent misusing it as spyware, a bully using it to check their messages pass. Each harm has a design answer. |
| Respects local agency | The child owns it. Nothing reaches a parent unless the child sends it. Communities write their own slang packs. |
| Maintainable and expandable by communities | Open source, small TypeScript engine, slang packs are plain JSON a teacher can edit, lessons are plain JSON a school can translate. |

## What Ward does

1. **Check a conversation.** The child shares a chat in: a WhatsApp export (`.txt`), pasted
   text, or a screenshot (read by Gemma's vision on desktop). Ward reads it on the device.
2. **See the pattern, not single words.** Three layers:
   - *Slang packs*: fast, offline, explainable. Community-written lists of insults, threats and
     coded words per language, with severity.
   - *Per-message model*: ShieldGemma (harassment policy) and Gemma for context, sarcasm and
     code-mixed language.
   - *Pattern engine*: repeated targeting of one person, pile-ons (many senders, one target, short
     window), accounts that join a group and only attack, exclusion ("don't add her"), threats,
     sharing of private images or info, late-night timing.
3. **The Haunting timeline.** The thread laid out over time with the attacks marked, who is
   doing it, and how it is escalating. Plain-language verdict sized for the child's age.
4. **Coach, child first.** "This is bullying. It isn't your fault." Then steps for the platform
   it happened on: don't reply, block, report (with the platform's own report path), save evidence,
   tell someone. Ward drafts a calm reply or a message to a trusted adult if the child wants one.
5. **Evidence vault.** Messages saved with their timestamps and a SHA-256 hash, encrypted on the
   device behind the child's PIN. Export a one-page report (PDF) for a school or the police.
6. **Trusted adult, on the child's terms.** The child picks who and when. The adult gets
   "they need you" and whatever the child chooses to send, never the full chat. One exception,
   stated up front in onboarding: if Ward sees signs of self-harm or a threat to life, it shows
   crisis lines straight away and urges the child to tell someone. It still never sends anything
   by itself.
7. **Resilience Path** (the Duolingo part). Short daily lessons with streaks, XP and levels:
   - Units: *Spot it* (bullying vs banter), *Shut it down* (block, mute, report), *Save it*
     (evidence), *Say it* (telling an adult), *Back them up* (being an upstander),
     *Lock it down* (privacy, sharing, passwords), *Bounce back* (feelings, self-talk).
   - Lesson types: pick the right move, spot the red flag in a chat, sort the messages, write a
     reply and have Gemma coach it, true/false myths.
   - Content written per age band; Gemma only grades free-text answers and gives feedback.
8. **Looks that grow up with them.** Themes by age band (8 to 10, 11 to 13, 14 to 17) and style.
   Onboarding asks for a look; gender only picks the starting suggestion. Changeable any time in
   Settings, with a neutral option always available.

## Platforms

One React app, three shells.

| Shell | Inference | Notes |
| --- | --- | --- |
| Desktop (Electron: macOS, Windows, Linux) | Ollama on the machine: `gemma4:e4b` (vision too), `shieldgemma:2b` | Same pattern as Deis: built and launch-tested in GitHub Actions. |
| Android APK (Capacitor) | Slang packs and pattern engine on the device, no model needed. Optional: pair with the family computer's Gemma 4 over home Wi-Fi. (Gemma 3 1B in WebAssembly was tested and dropped: it cleared real insults as harmless.) | App bundled inside the APK, works with the internet off. Built in Actions, launch-tested on an emulator. |
| Web (dev and demo) | Ollama if present, else wllama, else slang packs only | For judges who won't install anything. |

## Layout

```
ward/
  apps/web/          React + Vite + TypeScript UI (phone-first, roomy on desktop)
  packages/engine/   parsers, slang packs, pattern engine, model adapters, vault, report
  packages/lessons/  Resilience Path content (JSON) and lesson logic
  desktop/           Electron shell
  mobile/            Capacitor Android shell
  eval/              datasets, baselines, scorecards
  docs/              PLAN.md, HARMS.md
```

## Build order

1. **Engine** (no UI): WhatsApp/paste parser, slang packs (English, Roman Urdu, Hinglish, Bangla
   starter sets), pattern engine, Ollama adapter, scorer. Unit tests with written fixture chats.
2. **Eval**: Roman Urdu hate speech, Bangla blindspot, an English cyberbullying set. Compare
   slang-only, ShieldGemma, Gemma, and Ward combined. Write the scorecard.
3. **Design questions** with you, then the UI: onboarding, Check a chat, Haunting timeline,
   Coach, Vault, Resilience Path, Settings/themes.
4. **Vault and report**: WebCrypto AES-GCM behind a PIN, PDF export.
5. **Lessons**: seven units, three age bands, streaks and XP.
6. **Desktop**: Electron shell, installers in Actions.
7. **Android**: Capacitor shell, wllama on-device model, APK in Actions with an emulator
   launch test.
8. **Write-up**: README, HARMS.md, the DEV post with the eval numbers and the session embed.

## Scope cuts

Not building, on purpose:

- **Reading other apps' messages automatically** (Android accessibility or notification
  listeners). It is surveillance, Play Store policy blocks it, and it breaks the child-owns-it
  promise. The child shares a chat in.
- **A parent dashboard that reads messages.** That is the spyware model Ward exists to replace.
- **Unmasking anonymous accounts by writing style.** It could falsely accuse a child and
  de-anonymises minors. Ward shows that new accounts are acting together; it never guesses who.
- **Sending anything automatically** (to a parent, a school, a platform, the police). Ward drafts;
  the child sends.
- **Any cloud, accounts or telemetry.**
- **iOS.** No Mac signing setup for it, and Android is what most children in the target
  communities use.
- **Voice notes and video.** Text and screenshots only.

Stretch, only once everything above works:

- Android share target (share a chat straight from WhatsApp into Ward).
- Fine-tuning a small Gemma on Roman Urdu with Tinker, if the eval shows a gap worth closing.
- Screenshot reading on the phone.
- Urdu-script and Bangla-script UI translations.
