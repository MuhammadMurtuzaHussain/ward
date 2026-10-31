# Contributing to Ward

Thank you for helping. Ward is for children who are being hurt online, so a few rules here are
stricter than in most projects. Please read this page, the [code of conduct](CODE_OF_CONDUCT.md)
and the [safeguarding policy](docs/SAFEGUARDING.md) before you open a pull request.

## The one rule that matters most

**Never paste a real child's chat, name, photo, school or phone number anywhere in this project:**
not in an issue, a pull request, a test fixture, a commit message or a discussion. Not even your
own child's, and not even with names removed. Write a made-up message that shows the same thing.
If you see real data here, don't open or share it; follow
[SAFEGUARDING.md section 7](docs/SAFEGUARDING.md#7-disclosures-and-concerns-that-reach-the-project).

If a child is in danger right now, contact your local emergency number or a child helpline
([findahelpline.com](https://findahelpline.com)) first. An issue here is not watched around the clock.

## Ways to help

| You can | Start with |
| --- | --- |
| Report a wrong or missing helpline number | The **Helpline update** issue form |
| Suggest a slang word Ward should know | The **Slang word** issue form |
| Report a false alarm (Ward flagged something friendly) | The **False alarm** issue form |
| Translate or review a translation | The **Translation** issue form and [LANGUAGES.md](LANGUAGES.md) |
| Report a bug | The **Bug** issue form |
| Report a security flaw | **Not an issue.** Follow [SECURITY.md](SECURITY.md) |
| Raise a safeguarding concern | **Not an issue.** Follow [SAFEGUARDING.md section 10](docs/SAFEGUARDING.md#10-raising-a-concern-about-the-project-itself) |
| Propose a bigger change (a feature, a language, a platform) | A plain issue titled "Proposal: ...", open for at least 7 days ([GOVERNANCE.md](docs/GOVERNANCE.md#how-decisions-are-made)) |

Good first tasks are drafted in [docs/SEED_ISSUES.md](docs/SEED_ISSUES.md).

## Sign your commits (DCO)

Ward uses the [Developer Certificate of Origin](https://developercertificate.org) instead of a
contributor licence agreement. By signing off a commit you say you wrote it, or have the right to
submit it, under the project's licence. You keep your copyright.

Add the sign-off with `-s`:

```bash
git commit -s -m "Add Bangla word for 'fat' with a note"
```

That adds a line like `Signed-off-by: Your Name <you@example.com>` to the commit. Use a name and
email you are happy to have public. Every commit in a pull request needs one. If you forgot,
`git commit --amend -s` fixes the last commit and `git rebase --signoff main` fixes them all.

Today the sign-off is checked by hand when a pull request is reviewed; there is no automatic
check yet.

**Licence of contributions.** Code is MIT, like the rest of the repository ([LICENSE](LICENSE)).
The licence for lessons, stories, the school kit and translations has not been decided yet (see
[docs/DPG.md](docs/DPG.md#2-use-of-approved-open-licences)); until it is, they are contributed
under the repository's MIT licence.

## Set up and run the tests

You need Node 24 and pnpm (the version is pinned in `package.json`).

```bash
pnpm install
node apps/web/scripts/copy-ort.mjs   # Ward Lite's offline runtime; optional for most changes
pnpm dev                             # the app at http://localhost:5199
pnpm -r typecheck
pnpm test
```

`pnpm test` runs the engine, lessons and Discord bot tests plus the viewer, school kit, QR
transfer, corrections, help paths, helplines, vault and red-team leak tests. CI runs the
same command, a typecheck and a web build on every pull request
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)). Please run both before you push.

Ollama and Gemma are only needed if you work on the "close read" or run the scorecard
(`pnpm eval`). Most changes don't need them.

## Pull requests

- One change per pull request, with a short plain description of what changed and why.
- Add or update a test when you change behaviour.
- Say what you checked. If you couldn't test something (say, on Android), say that.
- Use made-up messages in tests and fixtures. The shared cast of characters in the stories is a
  good source of names.
- Small changes (a typo, a bug fix, a test) are merged after one maintainer review. Anything that
  changes what a child sees, types or shares needs more: see below and
  [GOVERNANCE.md](docs/GOVERNANCE.md#how-decisions-are-made).

## How slang-pack changes are reviewed

Slang packs are plain JSON in [`packages/engine/packs/`](packages/engine/packs/), one file per
language or script. Each entry is:

```json
{ "t": "the word or phrase, written the most common way", "c": "insult", "s": 1, "g": "English meaning" }
```

- `c` is one of `insult`, `appearance`, `identity`, `exclusion`, `threat`, `selfharm`, `sexual`,
  `exposure`, `mockery`.
- `s` is severity: **1** rude, **2** bullying, **3** dangerous. Severity 3 puts helplines first
  in the app, so it needs the most care.

A new word needs its meaning, a category, a severity, and a note in the pull request on why it is
there and where children use it. Then:

1. **Two people review it**: the proposer and a second speaker of the language. Once a language
   has a [language maintainer](LANGUAGES.md), that second person is the maintainer. Today no
   language has one, so the steward reviews and asks for a second speaker in the issue.
2. **Check for false alarms.** Many insults are also everyday words ("pagal" between friends,
   "kala" as a colour). Say how the word is used kindly, if it is. The engine tests include
   everyday Roman Urdu and English that must not trip the packs; add a line there if your word
   has an innocent twin.
3. **Severity 3 and anything sexual or about self-harm** also needs the safeguarding lead
   ([SAFEGUARDING.md section 5](docs/SAFEGUARDING.md#5-how-content-is-written-and-reviewed)). That
   role is not filled yet, so these words wait.
4. **Never tune to the test sets.** Don't add a word because it fixes a miss in
   [docs/REDTEAM.md](docs/REDTEAM.md) or the scorecard. A word has to be justified on its own,
   with an example you wrote yourself, or those numbers stop meaning anything.
5. `pnpm test` must pass.

## How lesson and story changes are reviewed

Lessons and stories live in [`packages/lessons/src/`](packages/lessons/src/) (`units.ts` and
`stories.ts` in English, `units.ur.ts` and `stories.ur.ts` in Urdu). The interface text is in
[`apps/web/src/i18n/`](apps/web/src/i18n/).

The tests already enforce two rules: no em dashes in anything a child reads, and the Urdu lessons
match the English ones exercise by exercise. So a change to an English lesson needs the Urdu one
changed in the same pull request (or a note asking for a translator, and the pull request waits).

The rest of the rules are in
[SAFEGUARDING.md section 5](docs/SAFEGUARDING.md#5-how-content-is-written-and-reviewed): no
shaming, no streak pressure, the mildest example that teaches the point, no real names, schools
or platforms' private details, and safe-messaging for anything about self-harm. Review is:

1. a maintainer;
2. a speaker of each language changed (the language maintainer, once there is one);
3. the safeguarding lead for anything that touches danger, self-harm, sexual content, telling an
   adult or the safety plan.

Until the safeguarding lead is appointed, changes in step 3 can be merged as drafts only if the
pull request says so plainly. They are not to be promoted to children more widely.

## Helpline numbers

Helplines are in [`apps/web/src/lib/help.ts`](apps/web/src/lib/help.ts). Every change must cite
where the number came from (the service's own site, Child Helpline International, or a
government page) in the pull request, and the date you checked it. Don't add a number you only
found on a list site. If a line is not free to call or has limited hours, say so in its note.

## Training data and Ward Lite

See [`train/README.md`](train/README.md), the data card [`train/DATA.md`](train/DATA.md) and the
model card [`train/MODEL_CARD.md`](train/MODEL_CARD.md). Nothing in `train/` may read
`eval/redteam/`, and a test fails if it does.

## Questions

Open an issue. Please be patient: Ward is maintained by one person today
([GOVERNANCE.md](docs/GOVERNANCE.md#roles)).
