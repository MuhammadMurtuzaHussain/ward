# Ward governance

> **DRAFT. Not yet reviewed by a safeguarding professional.** The parts of this document that
> concern young people (the [youth advisory group](#youth-advisory-group) and the
> [safeguarding lead](#safeguarding-lead)) in particular must be read by a qualified safeguarding
> reviewer before they are used. Until then, no young person should be recruited into any
> group described here. Reviewer details are recorded in
> [SAFEGUARDING.md](SAFEGUARDING.md#review-status).

Ward is an MIT-licensed project that began as one person's entry to a hackathon. This document
says how it grows into something that does not depend on that one person. Roles that are not yet
filled say so. We do not pretend a team exists that does not.

## What we are trying to protect

1. **Children's safety and privacy** come before features, speed and our own preferences. See
   [SAFEGUARDING.md](SAFEGUARDING.md). The "what Ward will never do" list there is not decided by
   a vote.
2. **Communities own the words.** The people who speak a language and know its slang decide what
   Ward says in it, not the people who wrote the engine.
3. **Openness.** Code, lesson text, slang packs, evaluation results and failures are public.

## Roles

| Role | Today | What they do |
| --- | --- | --- |
| **Project steward** | Muhammad Murtuza Hussain (author, copyright holder) | Holds the repository and release keys, resolves deadlocks, keeps this document honest. Aims to hand the repository to an organisation (see [Continuity](#continuity)). |
| **Maintainers** | The steward, until others join | Review and merge pull requests, cut releases, keep CI green. |
| **Language maintainers** | None yet | Own one language each. See below. |
| **Safeguarding lead** | `[safeguarding lead: to be appointed]` | Owns the safeguarding policy, reviews anything that touches danger or young people, handles disclosures and concerns. See below. |
| **Youth advisory group** | Not yet formed | Young people who review wording and ideas. See below. |
| **Contributors** | Anyone | Open issues, send pull requests, translate, report wrong helpline numbers. |

The steward is currently the only maintainer. That is a risk, and we name it. The first goal of
this document is to make it possible for someone else to become one.

## How decisions are made

**Small changes** (a typo, a bug fix, a test) are merged by any maintainer after one review. If
there is only one maintainer, they say what they checked in the pull request.

**Anything that changes what a child sees, types or shares** needs more. This includes lesson
and story text, coach steps, verdict wording, helplines, slang pack entries, prompts sent to
Gemma, and any new permission. These need:

1. a maintainer's approval, **and**
2. the language maintainer's approval if the change is in or for a language they own, **and**
3. the safeguarding lead's approval if it touches danger, self-harm, sexual content, telling an
   adult, the safety plan, or any gated feature.

**Larger decisions** (a new feature, a new platform, a new language, a dependency that changes
what the app can do, a change to the licence or to this document) are proposed in a public issue
labelled `proposal`. The discussion stays open for at least **7 days**. Maintainers decide by
**lazy consensus**: if no maintainer objects, the proposal passes. If a maintainer objects, we
talk until we reach agreement; if we cannot, a majority of maintainers decides, and the steward
breaks a tie.

**Things nobody can vote through.** These need the safeguarding lead's written agreement, a
public issue open for at least 30 days, and an announcement in the README:

- anything that makes Ward collect, send or share a child's data;
- anything that contacts anyone on the child's behalf;
- any adult-facing view of a child's chats or checks;
- turning on a gated feature (quiet mode, the keyboard);
- weakening the commitments in [SAFEGUARDING.md](SAFEGUARDING.md#8-what-ward-will-never-do).

**Safeguarding veto.** The safeguarding lead can block a release or revert a change that puts a
child at risk. The veto is recorded publicly with the reason, unless the reason would identify a
child (in which case the existence of the veto is public and the reason is recorded privately).

**Conflicts of interest.** Anyone who reviews a change must say if they have a financial,
employment or personal interest in it. Anyone with a conflict steps out of that decision.
Funders and partners (see [PHASES.md](PHASES.md#partner-technologies)) can ask for things;
they cannot decide what the app does with a child's data.

## Becoming a maintainer

There is no seniority test. We look for people who have shown care and judgement.

1. Contribute over a period of at least **three months**, with a few accepted pull requests that
   include tests.
2. Read [SAFEGUARDING.md](SAFEGUARDING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and say
   so.
3. Be nominated by an existing maintainer (or nominate yourself in a `proposal` issue).
4. No maintainer objects within 7 days.

A maintainer who has been inactive for **six months** is moved to "emeritus" after a message
asking whether they want to stay. Emeritus maintainers can return by asking. A maintainer can be
removed for a serious breach of the code of conduct or safeguarding policy by agreement of the
other maintainers and the safeguarding lead.

## Language maintainers

Ward is only useful in a language if the people who speak it say it is. Today, Ward has slang
packs for English, Roman Urdu, Hinglish and Bangla, and an interface and lessons in English and
Urdu. None of those has a named language maintainer yet. The Roman Urdu pack was grown from a
public dataset and reviewed by hand, but not under any process described here, and the Urdu
text is still waiting for a native speaker's review ([PHASES.md](PHASES.md)).

**What a language maintainer owns**, for one language (or one script of a language):

- **The slang pack** (`packages/engine/packs/<lang>.json`): which words and phrases are in it,
  with what meaning, category and severity. Two people review every added word: the proposer and
  the maintainer.
- **Translations**: the interface strings (`apps/web/src/i18n`), the lessons and stories, the
  coach steps, the adult guide and the school kit, and their tone and register for each age band.
- **Lesson review**: reading content in that language for meaning, for words that carry an
  unintended meaning, for cultural fit, and for anything that could shame a child.
- **The language's scorecard line**: keeping the test data honest, writing red-team cases in that
  language, and helping publish where Ward fails in it. Weak spots stay public. Bangla is one
  today.
- **Helpline entries** for countries where that language is spoken, with cited sources.

**What a language maintainer does not own:** the engine, the safeguarding policy, or the
"never do" list. They can say a change in their language is wrong; they cannot approve changes
to the app's data handling.

**How someone becomes one:**

1. They speak and write the language natively or at near-native level, and know how children
   and teenagers actually write it in chat.
2. They have contributed or reviewed in that language (a pack, a translation, a review of an
   existing lesson), in public, over at least a few weeks.
3. They read the safeguarding policy and code of conduct.
4. An existing maintainer or language maintainer nominates them in a `proposal` issue; 7 days
   with no objection.
5. They are listed in `MAINTAINERS.md` **(planned, to be created when the first one is
   confirmed)** with the name or handle they choose.

New languages: the first volunteer who meets the above and has a second person willing to review
becomes the maintainer for it, and the language gets its own folder and entry in the pack
list. A language with no active maintainer for six months is marked "unmaintained" in the README,
and its pack and text stay readable but are flagged as not recently reviewed.

Language maintainers who are under 18 are welcome as contributors, not as maintainers, and may
join the youth advisory group instead.

## Safeguarding lead

`[safeguarding lead: to be appointed]`

The lead is the person who answers for this project's safeguarding. They need not be a coder.
Ideally they have a recognised child-protection qualification or experience in a school,
helpline or child-welfare organisation. A person who is also the steward should not hold this
role for long: we want somebody who can say no to the steward.

**The lead:**

- owns [SAFEGUARDING.md](SAFEGUARDING.md) and reviews it at least once a year;
- is the point of contact for disclosures and concerns, and holds the records;
- reviews or delegates review of content about danger, self-harm, sexual content, the safety
  plan, and any gated feature;
- arranges background checks and training for anyone working with young people, and keeps the
  record;
- chairs the safeguarding side of the youth advisory group;
- can use the safeguarding veto;
- reports to the maintainers at least once every three months on what came up, without
  identifying anyone.

**Appointment.** The maintainers propose someone, the proposal is public for 14 days, and the
person accepts in writing. The role has a fixed term of `[term: for example two years]` and the
lead can resign at any time. A deputy `[deputy safeguarding lead: to be appointed]` covers
absences. Neither the steward nor a person with a financial interest in a partner should be the
only holder.

**Until someone is appointed,** the project does not recruit young people into groups, does not
run pilots, and does not turn on any gated feature.

## Youth advisory group

Status: **planned. Not formed.** No young person is to be approached until the safeguarding
lead is appointed, the terms below have been reviewed by a qualified safeguarding reviewer, and
a funder or sponsor is in place to pay for the group's work (see "Pay and credit").

### Purpose

To make Ward better for the people it is for. Members read lessons, stories and wording and say
what is wrong, what sounds fake, what would be embarrassing and what would help. They advise;
the maintainers and the safeguarding lead remain responsible for decisions.

### Who

Young people aged **14 to 17**, from different schools, genders, abilities and, as far as
possible, the countries and languages Ward serves. Children under 14 are consulted only through
a supervised school or youth-organisation session, not as individual members.

### Protections for members

These terms are the minimum. The reviewer may add to them. They apply whether the group meets
online or in person.

1. **Consent.** A parent or guardian gives written consent before a young person joins, in plain
   language, in the family's language, saying what the group does and does not involve. The young
   person gives their own written agreement too. Either can withdraw at any time, for any
   reason, without explanation and with no effect on anything else.
2. **No personal data published.** Members are never named, quoted by name, photographed or
   shown by face in the repository, the README, the website, a funding application or a talk.
   Credit uses a first name or a nickname the member chose, or "a member of the youth advisory
   group", and only if the member and their parent or guardian say yes in writing, separately
   for each use. The default is no credit.
3. **Minimal data held.** The project keeps a member's first name or nickname, an age band, a
   parent or guardian's contact, and the consent form. It does not keep home addresses, school
   names, or anything about the member's own experience of bullying unless they choose to share
   it. This record is held by the safeguarding lead alone, not in the repository, and is deleted
   within `[period: for example 3 months]` of the member leaving.
4. **Adult moderators with safeguarding checks.** Every adult who meets members is checked as
   described in [SAFEGUARDING.md](SAFEGUARDING.md#11-people-who-work-with-the-project) and has
   signed the code of conduct. At least two adults are present in any meeting or channel. No
   private one-to-one contact between an adult and a member. Meetings happen in agreed hours,
   never late at night.
5. **No personal stories required.** Members are asked about the app, not about their own lives.
   Nobody is asked to describe bullying that happened to them or to review real children's
   chats. Material they review is synthetic or made up. If a member chooses to share something
   personal, a moderator makes sure they know they do not have to, and checks they are okay.
6. **A way out and a way to complain.** Every member and parent has the contact for the safeguarding
   lead and for `[second contact, outside the maintainer group: to be named]`. Concerns go to
   somebody other than the person complained about.
7. **Distress.** Moderators know the signs, know the helpline list and stop a session if someone
   is upset. After any session that touched a hard topic, the group is told where to find help.
8. **No pressure to stay or to perform.** Members can skip any session, any task, or the whole
   group. They are not asked to recruit friends or to speak publicly.
9. **Safe tools.** The group meets on a platform the safeguarding lead has assessed as suitable
   for under-18s, with no public channels, no recording without consent, and moderated chat.
   `[Decision needed: which platform]`
10. **Disclosures.** If a member tells a moderator they or someone else is at risk, the moderator
    follows the disclosure steps in SAFEGUARDING.md and the lead decides on reporting. Members
    are told at the start, in plain words, that adults cannot keep a safety concern secret.

### Pay and credit

Young people's time is worth something. Members are **paid or compensated fairly** for their time
at a rate no lower than `[local fair rate: to be decided, for example a youth living-wage
equivalent]`, or given something of equal value that the member and their parent or guardian
prefer (a voucher, a course, a reference letter), and never in "exposure" alone. Expenses are
paid. The project does not start a group it cannot pay for. Where members want it, they are
credited in the way described in protection 2 above. A member can decline credit and still be
paid.

### Terms of reference

| | |
| --- | --- |
| **Size** | 6 to 10 members at the start. |
| **Term** | Six months, renewable once, so the group keeps changing. |
| **Meetings** | One hour, once a month, plus short review tasks (about an hour a month) done at times that suit school. |
| **Tasks** | Read new lessons and stories; flag wording that sounds wrong or babyish; say what they would never tell an app; suggest slang for packs (words the project then reviews itself); try a prototype with made-up chats. |
| **Not tasks** | Moderating the repository, labelling real messages, handling anyone's disclosure, or being the public face of the project. |
| **What happens to advice** | Written up (without names), answered in public by a maintainer, and logged as accepted, changed or declined, with the reason. |
| **Who runs it** | The safeguarding lead, with at least one other checked adult. |
| **Review** | The terms are reviewed by the safeguarding reviewer before the first meeting and after the first term. |

## Money and funding

Ward is meant to be free to a family. Grants and partners fund it; children and families do not
pay and are not the product. Funding sources are listed in the README. A funder cannot buy access
to data, because there is none, and cannot change the "never do" list.

`[Decision needed: whether to hold funds through a fiscal host or a registered organisation; and
which one.]`

## Continuity

If the steward is unavailable for **90 days** without notice, the remaining maintainers (or, if
there are none, the safeguarding lead) may ask GitHub to transfer the repository to a successor
organisation that shares these commitments. The MIT licence means anyone can fork the project; we
ask forks that serve children to keep the commitments in
[SAFEGUARDING.md](SAFEGUARDING.md#8-what-ward-will-never-do).

`[Decision needed: whether to move the repository into a GitHub organisation, and which.]`

## Communication

- **Public:** issues and pull requests on GitHub. Proposals are labelled `proposal`.
- **Private:** vulnerabilities through GitHub's private reporting
  ([SECURITY.md](../SECURITY.md)); safeguarding and conduct concerns to the addresses in
  [SAFEGUARDING.md](SAFEGUARDING.md#10-raising-a-concern-about-the-project-itself) and
  [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md).
- Nothing about an individual child is ever discussed in public.

## Changing this document

By pull request, using the proposal process (7 days open, 30 days and the safeguarding lead's
agreement for anything that touches the protections for young people). Review this document at
least once a year.
