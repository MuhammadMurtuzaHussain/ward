<p align="center"><img src="mobile/assets/icon-only.png" width="120" alt="Ward, a small friendly ghost" /></p>

<h1 align="center">Ward</h1>

<p align="center">
A guardian that lives on a child's own device. It spots cyberbullying in English, Roman Urdu,<br/>
Hinglish and Bangla, keeps the evidence, coaches the next step, and trains kids to bounce back.<br/>
<b>Open-weight Gemma, running locally. A child's messages never leave the device.</b>
</p>

<p align="center">
<a href="https://github.com/MuhammadMurtuzaHussain/ward/releases/latest/download/Ward-android.apk"><img src="https://img.shields.io/badge/Android-APK-0f1024?style=for-the-badge&logo=android&logoColor=ffb547" alt="Download for Android" /></a>
<a href="https://github.com/MuhammadMurtuzaHussain/ward/releases/latest"><img src="https://img.shields.io/badge/Desktop-macOS%20%C2%B7%20Windows%20%C2%B7%20Linux-0f1024?style=for-the-badge&logoColor=ffb547" alt="Desktop installers" /></a>
</p>

Built for the DEV Hacktoberfest Open-Source AI Challenge, Week 4 (*Ghost in the Machine*), as an
answer to World Solve problem [WS05937](https://www.worldsolve.org/index.php?view=problem&id=5937):
*Building effective interventions for cyberbullying harming children by 2030.*

The bully is the ghost haunting the chat. Ward is the ghost on your side.

## Why

One in six school-aged children was cyberbullied in WHO/Europe's 2024 study of 279,000 children
across 44 countries, up from 2018. The tools that exist for it mostly do one of two things:

- **Upload a child's messages to a company** so a parent can read them. Kids learn to hide, and
  the child's private life sits on someone else's server.
- **Filter in English.** Bullying in Roman Urdu, Hinglish or Bangla goes straight past them.

Ward flips both. It belongs to the child, it runs on their device, and it reads the languages
they actually type in.

## What it does

| | |
| --- | --- |
| **Check a chat** | Share in a WhatsApp export, paste messages, or drop screenshots (read by Gemma's vision on desktop). Say which person is you. |
| **See the pattern** | One mean message is rude; bullying is a pattern. Ward finds the same person again and again, pile-ons, accounts added to a group just to attack ("ghost accounts"), exclusion, attacks after 11pm, and messages that are dangerous (threats, telling someone to hurt themselves, sexual pressure, threats to share photos). |
| **The Haunting** | The chat laid out with the attacks lit up and every ordinary stretch folded away, a verdict in plain words for the child's age, and who is doing it (and who isn't). |
| **Coach** | Don't reply, save it, block/report/mute with steps for WhatsApp, Instagram, TikTok, Snapchat and Discord, and a message to a trusted adult that Gemma drafts in a kid's voice. Ward never sends anything itself. |
| **Get help now** | Anything dangerous puts helplines for the child's country at the top (Pakistan, India, Bangladesh, UK, US, plus findahelpline.com) and Take It Down for images. |
| **Evidence vault** | Saved chats are encrypted (AES-GCM, key from a PIN via PBKDF2) and each message is SHA-256 fingerprinted. One tap makes a report for a school or the police. |
| **Resilience Path** | Duolingo-style daily lessons with streaks and XP: *Spot it, Shut it down, Save it, Say it, Back them up, Lock it down, Bounce back*. Five exercise types, Gemma gives feedback on written answers, content per age band (8 to 10, 11 to 13, 14 to 17). No hearts to lose: a child learning to cope with bullying shouldn't be punished for a wrong guess. |
| **Your night light** | Six looks the child picks from a gallery (no gender question), and an age band that changes how playful or grown-up it feels. |

## Does it work? The scorecard

Same balanced sample for every system, 200 messages per language, half abusive by each dataset's
own labels. All run locally on a MacBook through Ollama. Full method in
[`eval/results/scorecard.md`](eval/results/scorecard.md); rerun it with `pnpm eval`.

| Caught (recall) | Slang packs (no AI) | ShieldGemma 2B | Gemma 4 E4B (Ward) |
| --- | --- | --- | --- |
| **Roman Urdu** | 59% | 14% | **86%** |
| **Bangla** (abuse aimed at a person) | 10% | 14% | **65%** |
| **English** (tweet dataset) | 10% | 19% | **36%** |

Google's own safety classifier misses 86% of abusive Roman Urdu. Gemma 4, given context and
asked the question a child is asking, catches 86% at 86% precision.

The English set is mostly tweets *about* gender and other topics rather than aimed at one person,
so every system scores low on it; Ward's pattern engine (pile-ons, repeats, ghost accounts) is
tested on the chats in [`packages/engine/fixtures`](packages/engine/fixtures).

**We also tried a 1B model for phones** (Gemma 3 1B via llama.cpp in WebAssembly). On our test
chat it cleared real insults as harmless and dropped the verdict from "Get help now" to "Keep an
eye". A small model that wrongly reassures a bullied child is worse than none, so Ward's phone
app runs the slang packs and pattern engine on the device, and can pair with the family
computer's Gemma 4 for the close read.

## Why open

- **Privacy is the product.** A child's chats can't go to a vendor. Open weights running locally
  are the only way to read them with a real language model and keep that promise.
- **It works where resources are scarcest.** No account, no subscription, no data plan after
  install. Slang packs and patterns work on the cheapest Android phone with the internet off.
- **Communities own the words.** Slang packs are plain JSON (`packages/engine/packs`). A teacher
  in Lahore or a youth worker in Dhaka can add the insults kids around them actually use, without
  asking anyone. The Roman Urdu pack was grown from a public dataset's training split and
  reviewed by hand ([`eval/mine-ru.ts`](eval/mine-ru.ts)).
- **It can't disappear.** MIT licensed. If we stop, anyone can carry it on.

## What could go wrong

[`docs/HARMS.md`](docs/HARMS.md) goes through false negatives, false positives, blaming the
wrong person, parents using it as spyware, bullies testing their messages against it, and
self-harm, with what Ward does about each. Things we chose not to build are in
[`docs/PLAN.md`](docs/PLAN.md#scope-cuts), including unmasking anonymous accounts.

## Run it

```bash
pnpm install
ollama pull gemma4:e4b          # the close read; Ward still works without it
pnpm dev                        # http://localhost:5199
pnpm -r test                    # engine and lessons
pnpm eval                       # the scorecard (also needs: ollama pull shieldgemma:2b)
```

- **Desktop app:** `pnpm --filter @ward/desktop start`. Installers are built in GitHub Actions
  (`desktop.yml`) for macOS, Windows and Linux; each is launched once before it's kept. Unsigned
  for now: on macOS, right-click Ward.app and choose Open the first time.
- **Android:** `mobile/` is a Capacitor shell with the app bundled inside, built and launch-tested
  on an emulator with Wi-Fi off in `android.yml`. Cloud backup is off, so the vault never leaves
  the phone.
- **Phone + family computer:** start Ollama on the computer with `OLLAMA_HOST=0.0.0.0`, then put
  `http://<computer's address>:11434` in Ward's Me screen on the phone.

## How it's built

```
packages/engine    TypeScript: WhatsApp/paste parser, slang packs, pattern engine,
                   Gemma and ShieldGemma judges (Ollama), all unit-tested
packages/lessons   the Resilience Path as plain data, with content tests
apps/web           React 19, Vite, Tailwind 4, Motion, Phosphor icons
desktop            Electron, served from app://ward (one of Ollama's allowed origins)
mobile             Capacitor Android
eval               datasets, baselines and the scorecard
```

The drop zone's travelling rim light is adapted from the idea in cult-ui's Halo Dropzone on
21st.dev. Fonts: Bricolage Grotesque and Atkinson Hyperlegible Next (built for readability).

## Licence

MIT. Helpline numbers were checked on 2026-10-29; please open an issue if one is wrong or
missing for your country.
