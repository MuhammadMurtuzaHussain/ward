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

The bully is the ghost haunting the chat. Ward is the ghost on your side.

## What this is, and what it isn't

Ward is a response to World Solve problem
[WS05937](https://www.worldsolve.org/index.php?view=problem&id=5937): *Building effective
interventions for cyberbullying harming children by 2030*, built for the DEV Hacktoberfest
Open-Source AI Challenge, Week 4 (*Ghost in the Machine*).

**It doesn't solve cyberbullying.** Nothing built in a week could. What's here is:

1. **An MVP** that works: a child-owned app for Android, desktop and the web, tested on the
   device and in CI.
2. **An approach** with numbers behind it: a scorecard showing open-weight Gemma reads abuse in
   the languages these children type, where an English-first safety model goes blind.
3. **A path** to an intervention that helps children at scale, including what's missing and how
   we'd measure whether children are actually better off: [docs/ROADMAP.md](docs/ROADMAP.md).

The evidence is clear that apps alone don't fix bullying. School-wide programs that involve
peers and teachers do best, and even they cut cyberbullying modestly (g = -0.13 to -0.18 across
50 studies). So Ward is built as the child's front door into the people who can help: the adult
they tell, their class, and helplines.

## Three rings

### The child

| | |
| --- | --- |
| **Share to Ward** | In WhatsApp, *Export chat* and pick Ward from the share list (Android). Or paste messages, or drop screenshots on desktop. Say which person is you. |
| **Reads on any phone** | Ward Lite, a 38 MB model inside the app, reads every message offline. On a computer, Gemma 4 reads with context and can tell banter from bullying. On Android phones with 6 GB+, Gemma 4 E2B can be downloaded to help write. |
| **See the pattern** | One mean message is rude; bullying is a pattern. Ward finds the same person again and again, pile-ons, accounts added to a group just to attack ("ghost accounts"), exclusion, attacks after 11pm, and dangerous messages (threats, telling someone to hurt themselves, sexual pressure, threats to share photos). |
| **The Haunting** | The chat with the attacks lit up and every ordinary stretch folded away, a verdict in plain words for the child's age, and who is doing it (and who isn't). |
| **Coach** | Don't reply, save it, block/report/mute with steps for WhatsApp, Instagram, TikTok, Snapchat and Discord, and a message to a trusted adult that Gemma drafts in a kid's voice. Ward never sends anything itself. |
| **Get help now** | Anything dangerous puts helplines for the child's country first (including Pakistan's Madadgaar 1098 and DRF Cyber Harassment Helpline 0800-39393), plus Take It Down for images. |
| **Evidence vault** | Saved chats are encrypted (AES-GCM, key from a PIN via PBKDF2), each message SHA-256 fingerprinted. |
| **Resilience Path** | Duolingo-style daily lessons with streaks and XP: *Spot it, Shut it down, Save it, Say it, Back them up, Lock it down, Bounce back*. Content per age band (8 to 10, 11 to 13, 14 to 17). No hearts to lose. |
| **Stories** | Short branching chats where *you* choose: laugh along, stay quiet, speak up, tell someone. Every ending says what that choice did and what else could work, and you can go back and try another. One per age band so far, in English and Urdu. |
| **Your night light** | Six looks the child picks from a gallery, no gender question. The age band changes how playful or grown-up it feels. |
| **English and اردو** | The whole app, lessons included, in English or Urdu (right to left, Nastaliq script). Switch any time in Me. |
| **Read aloud** | A Listen button on lessons, onboarding, verdicts and coach steps, on by default for the youngest children. English is narrated with ElevenLabs and bundled, so it works offline. |
| **Shared phones** | Each person gets their own Ward behind an optional PIN. Quick exit (a button, or Escape twice) locks it instantly and hides it from the recents screen. |

### The child's circle

| | |
| --- | --- |
| **For the adult they told** | A page the child hands over, in English and Urdu: what to do in the first minutes, what not to do (take the phone away, confront the other family), and next steps with school, the app and a helpline. |
| **Class mode** | A teacher projects any lesson for a whole room: one question at a time, the class votes or talks, then the answer. Ground rules up front. Nothing recorded, no accounts. |
| **School kit** | A term plan, a lesson plan per unit, a letter home (English and Urdu) and an anonymous before and after survey, all printable. The teacher types in the totals and sees what changed. Nothing about any child is collected. |

### The community

| | |
| --- | --- |
| **A helpline-ready report** | The child picks who it's for and what they want to happen; details about them are optional. They get a readable page plus `ward-report.json` in a documented format ([docs/REPORT.md](docs/REPORT.md)) with a digest a helpline can check. Only hurtful messages go in. The rest of the chat stays private. |
| **Case viewer** | [`viewer/ward-viewer.html`](viewer/ward-viewer.html): one offline file a caseworker double-clicks. It checks the report wasn't edited (digest and every message's fingerprint), puts safety and the child's wishes first, and exports a summary, a CSV or a print view. No network, nothing uploaded. |
| **Counsellor mode** | A counsellor's Ward that takes a child's report by file or by QR codes from the child's screen (no internet needed), checks it, and keeps case notes. Locked with a PIN, on that device. No server. |

## Does the approach work? The scorecard

Same balanced sample for every system, 200 messages per language, half abusive by each dataset's
own labels. All run locally through Ollama. Method in
[`eval/results/scorecard.md`](eval/results/scorecard.md); rerun with `pnpm eval`.

| Caught (precision) | Word lists only | ShieldGemma 2B | **A phone: word lists + Ward Lite** | Gemma 4 E2B (phone size) | **A computer: Gemma 4 E4B** |
| --- | --- | --- | --- | --- | --- |
| **Roman Urdu** | 59% (94%) | 14% (70%) | **85% (83%)** | 33% (75%) | **86% (86%)** |
| **Bangla** (abuse aimed at a person) | 10% (83%) | 14% (93%) | **39% (74%)** | 34% (71%) | **65% (78%)** |
| **English** (tweet dataset) | 10% (91%) | 19% (73%) | **83% (64%)** | 33% (69%) | **36% (72%)** |

**Ward Lite** is a small classifier we distilled for phones ([`train/`](train/)): 37.7 MB, about 8 ms
per message on one CPU thread, fully offline. It was trained only on data the scorecard never
sees (a leak check dropped 97 overlapping messages), and in the app it can only *add* warnings,
never clear one. On a phone it brings Roman Urdu close to the computer's Gemma 4. Bangla is
still the weak spot: the next step is more real, non-abusive Bangla chat to train on.

This measures whether Ward *reads* abuse, not whether children are better off. That second
question needs a pilot in schools; the plan is in [docs/ROADMAP.md](docs/ROADMAP.md#measurement-plan).

What the numbers do and don't show:

- **English is low for every system.** That dataset is mostly tweets *about* gender and other
  topics rather than aimed at one person. Ward's pattern engine is tested on the chats in
  [`packages/engine/fixtures`](packages/engine/fixtures).
- **Small generative models are poor judges.** Gemma 3 1B cleared real insults as harmless.
  Gemma 4 E2B (phone-sized, run natively through LiteRT-LM) caught about a third, and it loses
  track of lists longer than 5 messages. So on phones Ward Lite reads the chats, and Gemma 4 E2B,
  if the child downloads it, does what it's good at: writing the message to a trusted adult and
  giving feedback on lesson answers.

## What could go wrong

[`docs/HARMS.md`](docs/HARMS.md) covers false negatives, false positives, blaming the wrong
person, parents using it as spyware, bullies testing messages against it, and self-harm, with
what Ward does about each. None of it has been reviewed by a child-protection professional yet;
that comes before any pilot.

## Why open

- **Privacy is the product.** A child's chats can't go to a vendor. Open weights running locally
  are the only way to read them with a real language model and keep that promise.
- **It works where resources are scarcest.** No account, no subscription, no data plan after
  install. Slang packs and patterns work on a cheap Android phone with the internet off.
- **Communities own the words.** Slang packs are plain JSON (`packages/engine/packs`). The Roman
  Urdu pack was grown from a public dataset's training split and reviewed by hand
  ([`eval/mine-ru.ts`](eval/mine-ru.ts)).
- **It can't disappear.** MIT licensed, and headed for the Digital Public Goods registry.

## Run it

```bash
pnpm install
ollama pull gemma4:e4b          # the close read; Ward still works without it
pnpm dev                        # http://localhost:5199
pnpm -r test                    # engine, report format and lessons
pnpm eval                       # the scorecard (also needs: ollama pull shieldgemma:2b)
```

- **Desktop:** `pnpm --filter @ward/desktop start`. Installers for macOS, Windows and Linux are
  built and launch-tested in GitHub Actions (`desktop.yml`). Unsigned for now: on macOS,
  right-click Ward.app and choose Open the first time.
- **Android:** `mobile/` is a Capacitor shell with the app bundled inside and a small native
  plugin for Share to Ward, built and launch-tested on an emulator with Wi-Fi off
  (`android.yml`). Cloud backup is off, so the vault never leaves the phone.
- **Phone + family computer:** start Ollama on the computer with `OLLAMA_HOST=0.0.0.0`, then put
  `http://<computer's address>:11434` in Ward's Me screen on the phone.

## How it's built

```
packages/engine    parser, slang packs, pattern engine, Gemma and ShieldGemma judges,
                   the ward.report/v1 builder; unit-tested
packages/lessons   the Resilience Path as plain data, with content tests
apps/web           React 19, Vite, Tailwind 4, Motion, Phosphor icons
desktop            Electron, served from app://ward (one of Ollama's allowed origins)
mobile             Capacitor Android with the ShareIn plugin
eval               datasets, baselines and the scorecard
docs               PLAN, HARMS, REPORT, ROADMAP
```

The drop zone's travelling rim light is adapted from the idea in cult-ui's Halo Dropzone on
21st.dev. Fonts: Bricolage Grotesque and Atkinson Hyperlegible Next.

## Help wanted

If you work at a child helpline, a school, or with young people in Pakistan, India or
Bangladesh, we'd like to hear what's wrong with this before anyone builds more of it. Open an
issue, or start with [docs/ROADMAP.md](docs/ROADMAP.md).

## Licence

MIT. Helpline numbers were checked on 2026-10-29; please open an issue if one is wrong or
missing for your country.
