# Languages in Ward

Ward is only useful in a language if the people who speak it say it is. This page lists what
exists in each language and script, and who looks after it.

**Today nobody does.** No language has a named language maintainer. Everything below was written
or assembled by the project's one maintainer, and none of the South Asian language work has been
reviewed by a native speaker under the process in
[GOVERNANCE.md](docs/GOVERNANCE.md#language-maintainers). Read every line here as unreviewed.

## What exists

| Language or script | Slang pack | App and lessons | Read aloud | Ward Lite training data | Red-team items | Maintainer |
| --- | --- | --- | --- | --- | --- | --- |
| English | [`en.json`](packages/engine/packs/en.json), 53 entries | Yes | Bundled recordings | Yes (tweets, CB1) | 71 | **None** |
| Urdu (Urdu script) | None: packs never match Urdu script | Yes, right to left, Nastaliq | The device's own voice; may be silent in Android's WebView (untested) | None listed in the data card | None | **None** |
| Roman Urdu | [`ur-Latn.json`](packages/engine/packs/ur-Latn.json), 117 entries | No | No | Yes (roman_urdu_hate_speech) | 67 | **None** |
| Hinglish (Hindi in Latin letters) | [`hi-Latn.json`](packages/engine/packs/hi-Latn.json), 19 entries | No | No | Yes | 63 | **None** |
| Hindi (Devanagari) | None | No | No | Yes, but no danger examples | None | **None** |
| Bangla (Bangla script) | [`bn.json`](packages/engine/packs/bn.json), 30 entries shared with romanised Bangla | No | No | Yes | 41 | **None** |
| Bangla (romanised) | Shares `bn.json` | No | No | Not counted separately from Bangla | 33 | **None** |

Entry counts are as of 2026-10-31; the files are the source of truth. Red-team counts are from
[docs/REDTEAM.md](docs/REDTEAM.md). How well Ward reads each language is in the
[scorecard](eval/results/scorecard.md) and [docs/REDTEAM.md](docs/REDTEAM.md). Bangla is the weakest
measured; Urdu script and Devanagari aren't measured at all.

## What a language maintainer does

In short (the full description is in
[GOVERNANCE.md](docs/GOVERNANCE.md#language-maintainers)):

- owns the slang pack for one language or script, and is the second reviewer on every added word;
- reviews translations of the interface, lessons, stories, adult guide and school kit for meaning,
  register and anything that could shame a child;
- keeps that language's scorecard line and red-team items honest, and helps publish failures;
- checks helpline entries for countries where the language is spoken.

They don't own the engine, the safeguarding policy or the "never do" list.

## Becoming one

You speak and write the language natively or near-natively, and know how children and teenagers
actually type it in chat. Contribute or review in that language in public for a few weeks (a
pack entry, a translation, a review of an existing lesson), read the
[safeguarding policy](docs/SAFEGUARDING.md) and [code of conduct](CODE_OF_CONDUCT.md), then ask
to be nominated in a proposal issue. If no one objects in 7 days, your name or handle goes in the
table above.

Under 18? You are very welcome as a contributor, and the youth advisory group is planned for you,
but maintainers are adults.

## Most wanted

1. A **Bangla** speaker to review `bn.json` and the Bangla red-team items, and help find real,
   non-abusive Bangla chat that Ward Lite can learn from.
2. An **Urdu** speaker to review the Urdu interface, lessons and stories.
3. **Roman Urdu** and **Hinglish** speakers to review those packs and their false alarms
   (friendly "pagal", "gadha", "kamina").
4. A second person for every language above, so no word is added on one person's say-so.

Start with the **Translation** or **Slang word** issue form, or see
[CONTRIBUTING.md](CONTRIBUTING.md).
