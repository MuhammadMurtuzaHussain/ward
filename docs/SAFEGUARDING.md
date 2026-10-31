# Ward safeguarding policy

> **DRAFT. Not yet reviewed by a safeguarding professional.** This document was written by the
> project's maintainers and has not been checked by anyone qualified in child protection. Until a
> qualified reviewer has read it and signed off (see [Review status](#review-status)), treat it as
> a statement of intent, not as an assurance. Nothing here should be quoted to a child, a parent,
> a school or a funder as "reviewed" or "approved".

Ward is an app that children use when something online is hurting them. That makes safeguarding
the project's first job, not an extra. This policy says what Ward does, what the people who
maintain it do, and what we will never do. Where something is not built or not yet in place, it is
marked **planned** so nobody reads a hope as a fact.

Related documents: [HARMS.md](HARMS.md) (what can go wrong in the app),
[GOVERNANCE.md](GOVERNANCE.md) (who decides, and the safeguarding lead role),
[PHASES.md](PHASES.md) (what is built and what is not), [../SECURITY.md](../SECURITY.md) and
[../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md).

## 1. Principles

**The child leads.** The child owns Ward. They choose what to check, what to save, who to tell
and when. Ward suggests; it does not decide for them and it does not act behind their back.

**Everything stays on the device.** Chats are read on the device. Ward has no account, no server
of ours, no analytics and no telemetry. Unsaved checks are forgotten when Ward closes. Saved
evidence is encrypted under a PIN only the child knows. The only network calls in the app are
ones the child sets up or chooses: asking their own Ollama computer to read a chat, downloading
the optional phone model, and opening a helpline site or Take It Down link. None of them carries
a chat to us.

**No data collection means nothing to leak, and nothing to hand over.** We cannot read a child's
chats, so we cannot be asked to share them and we cannot lose them. This is also why Ward cannot
rescue a child on its own (see [section 4](#4-what-ward-does-when-it-sees-danger)). We accept
that trade on purpose and say so to the child in onboarding.

**Honest, not frightening.** Ward never tells a child they are overreacting, never shames them
and never blames them. Every "looks okay" result ends with "If it still feels wrong, trust that
feeling and tell someone."

**Every path ends at a person.** An app cannot make bullying stop. Ward's job is to help a child
see clearly, keep proof and take safe next steps, and to get a trusted adult, a helpline or a
teacher involved on the child's terms.

**Humble about evidence.** The evidence for app-only interventions is thin
([ROADMAP.md](ROADMAP.md#what-the-evidence-says)). We do not claim Ward protects children until a
school pilot measures it.

## 2. Age bands and how content differs

Ward uses three self-declared age bands: **8 to 10**, **11 to 13** and **14 to 17**. The child
picks their band in onboarding and can change it. Ward does not verify age, because verifying it
would mean collecting data we have chosen not to collect. Ward is not built for children under 8.

What changes by band, as the app works today:

- **Lessons and stories.** Every lesson is tagged with the bands it is for
  (`packages/lessons/src/types.ts`). Each band has its own path of at least six units, and a
  test fails if that stops being true. One lesson (`lock-2`) is teen-only and a test checks it
  stays out of the 8 to 10 path. Branching stories exist for each band, with endings that are
  kind, mixed or hard and never a telling-off.
- **Wording and look.** The verdict, the coach and the look of the app are written for the band.
  The youngest band gets bigger buttons, more of Ward the ghost, and read-aloud on by default.
  The 14 to 17 band gets plainer language and "This is bullying, not banter."
- **Safety plan.** The teen safety plan (warning signs, things that help, people, safe places) is
  shown to the 14 to 17 band only. It is sealed in the vault under the child's PIN.
- **Gemma's writing.** When Gemma drafts a message to a trusted adult or gives feedback on a
  written answer, it is told the child's age band and asked for simple, honest words that age
  would use, with no insults quoted (`apps/web/src/lib/draft.ts`, `grade.ts`).

What does not change by band: the safety floor. Dangerous messages produce the same "Get help
now" result, with helplines first, for a child of 8 and a child of 17.

**Not yet done (planned):** a child-development reviewer checking that each band's wording is
right for that age; testing with children, which needs ethics approval first (see
[section 9](#9-research-and-pilots)).

## 3. Who the content is for, and how Ward talks about people

- Ward is gender-neutral in what it asks and says. There is no gender question. Tests keep story
  readers ungendered.
- Ward never names anyone outside the app, never guesses who is behind an anonymous account and
  never labels a child a "bully". The self-check "Was I mean?" never uses that word.
- People in a chat who did nothing hurtful, including anyone who stood up for the child, are
  listed as "Not part of it".
- The report a child can make for a helpline or school includes only the hurtful messages sent
  by others. It leaves out the rest of the chat, the child's own messages, and anything that
  identifies the child beyond what they chose to add.

## 4. What Ward does when it sees danger

Ward treats four things as dangerous: **threats**, **messages telling the child to hurt
themselves**, **sexual pressure**, and **threats to share photos or private things**.

When Ward finds one:

1. The result's level becomes **Get help now**, and the wording says plainly that this is never
   okay and not the child's fault.
2. A help block appears at the top of the result and at the top of the coach page, with the
   **emergency number and the helplines for the child's country**
   (`apps/web/src/lib/help.ts`). The country is guessed from the device time zone and the child
   can change it. Countries covered today: Pakistan, India, Bangladesh, the United Kingdom and
   the United States, with Find A Helpline for everywhere else. Numbers were last checked on
   2026-10-29.
3. If the danger involves images, Ward adds **Take It Down**, which helps remove nude or sexual
   images of under-18s, including ones the child sent themselves. The coach says in bold: stop
   replying, and never pay.
4. Dangerous words stay visible even when Gemma reads them as a joke, with "It may be a joke, but
   these words are serious. How did it feel?" We chose a gentle, visible flag over silence.
5. A small model such as Ward Lite can raise a warning but can never lower one the word lists
   call dangerous.
6. For the 14 to 17 band, an urgent result about their own chat points to the safety plan.

**Ward never contacts anyone on the child's behalf.** It does not message a parent, a school, a
platform, the police or a helpline. It does not send an alert. The child is told this in
onboarding: "If a chat says someone wants to hurt you, or tells you to hurt yourself, I'll show
you who to call straight away. I still won't tell anyone myself." We weighed an automatic alert
and rejected it: a child who learns the app tells on them stops using it, and then it helps
nobody ([HARMS.md](HARMS.md#ward-handles-something-it-shouldnt-handle-alone)).

**Telling an adult.** Ward drafts a short message to a trusted adult in a child's voice, without
quoting insults. The child edits it, copies it and sends it themselves. When a child checks a
chat for a friend, the coach advises bringing in an adult if the friend could be in danger, or if
someone is asking them for photos or money, "even if they asked you not to", and says why. Ward
still sends nothing.

**What Ward cannot do, and says so.** It cannot know whether the child is safe right now. It asks
(the report has an "Are you in danger right now?" question) and records only what the child
answers. It cannot call for help. This limit is deliberate, and it is the reason the help block
is the most prominent thing on the screen.

**Planned:**

- A review of every crisis screen and helpline entry by a child-protection professional, with the
  reviewer's name and date recorded here.
- A yearly recheck of every helpline number, and a quick path for anyone to report a wrong
  number (the README already asks for issues; a template is planned).
- Helplines in more countries, each entered with a cited source, in the pull request that adds
  it.

## 5. How content is written and reviewed

"Content" means lessons, stories, coach steps, verdict wording, the adult guide, the school kit,
helpline entries, slang packs and Gemma's instructions.

**Rules for everything a child reads** (the first two are already enforced by tests):

- No em dashes in anything a child reads.
- The Urdu lessons must match the English ones in structure, lesson by lesson and exercise by
  exercise.
- Writing is never marked wrong. Gemma's feedback is one warm, specific note; without a model the
  child sees an example answer.
- No shaming, no guilt, no streak pressure, no hearts to lose.
- Stories and lessons never show a real person's name, a real school or a real platform's
  private details. Characters are the shared cast.
- Do not quote slurs in a lesson or story when a description will do. Where an example message is
  needed, use the mildest one that teaches the point.
- Nothing that teaches a way to harm oneself or another person, or that could work as a how-to
  for stalking, unmasking or evading a platform's safety tools.
- Anything about suicide or self-harm follows recognised safe-messaging guidance and points to a
  helpline. **Planned:** name the guidance we follow and have the reviewer check it.

**Review before release.** Today, content is reviewed by the maintainer who wrote it and by the
automated tests. That is not enough for material about bullying, self-harm and sexual pressure.
The intended process, which is **planned**:

1. **Draft** by anyone, through a pull request.
2. **Language review** by the language maintainer for that language (see
   [GOVERNANCE.md](GOVERNANCE.md#language-maintainers)): is the wording natural, is it the right
   register for the age band, is it free of unintended meanings?
3. **Safeguarding review** by the safeguarding lead or a delegated qualified reviewer, for
   anything that touches danger, self-harm, sexual content, telling an adult, or the safety plan.
4. **Young people's review** by the youth advisory group where it exists: does this sound like
   it was written by someone who has met a teenager?
5. **Record.** The pull request notes who reviewed what. Reviewers' names appear only with their
   consent.

**Not to be turned on more widely until the professional review is done:** the safety plan, the
"Was I mean?" repair steps, and every crisis path. The phases document already says this for the
safety plan.

**Slang packs** are plain JSON, so anyone can propose a word. A word may only be added with its
meaning, a severity and a note on why it is there. **Planned:** two-person review on every added
word, one of them the language maintainer, and a published list of what each word means.

**Gemma and other models.** Models only read, draft and give feedback. They cannot change a
verdict downwards where the word lists call it dangerous, cannot send anything and cannot reach
the network except the child's own Ollama computer. Prompts sent to a model are in the open
source code and are part of content review. Model output is shown to the child as a suggestion
they can edit or ignore.

## 6. Gated features and why

Two features are held back until safeguarding review. **Neither exists in the app today.**

**Quiet mode (planned, not built).** A neutral app name and icon for children whose risk is at
home. It could help a child who would be punished for having Ward on their phone. It could also
hide the app from an adult who has a duty to know, and it changes what a parent sees on a phone
they are responsible for. The decision of whether, and for whom, needs a safeguarding reviewer.
It is not to be built until a reviewer has signed off in writing, and the sign-off will be linked
from here. Shared-phone mode (separate profiles, PIN, quick exit) is built and is the gentler
answer to the same need.

**The Ward keyboard (planned, not built).** An opt-in Android keyboard that notices a hurtful
message before it is sent and offers a pause. A keyboard sees everything a child types,
including passwords and private messages. If it is built, it will only be built after review,
with these conditions written down in advance: opt-in by the child, on-device only, nothing
logged or stored, no network permission for the keyboard component, no sending of typed text
anywhere, and the child can turn it off in one tap. A parent turning it on for a child is a
different feature, and we have decided not to build that one (see [section 8](#8-what-ward-will-never-do)).

**Other held-back work:** Ward Annotate, where vetted adults and young volunteers label messages
to grow the training data. It would use synthetic and public messages only, never a real child's
chat, and volunteers under 18 would need a parent's consent and an adult moderator.

## 7. Disclosures and concerns that reach the project

Ward collects nothing, so the project should almost never learn anything about an individual
child. It can still happen: a child or adult may write in an issue, a discussion, an email or a
pull request.

**What we ask people not to do.** The README, issue templates (planned) and this policy say:
please do not paste a real child's chat, name or photo into an issue. Use made-up examples.

**If someone tells us they are being harmed, or that a child is.**

1. Whoever sees it tells the **safeguarding lead** (`[safeguarding lead: to be appointed]`,
   contact `[safeguarding contact address: to be created]`) the same day. Until a lead is
   appointed, the maintainer who sees it does this and writes down what they did.
2. **Respond kindly and briefly.** Believe them. Say it is not their fault. Do not ask for
   details, do not promise to keep it secret, and do not ask them to prove it.
3. **Point to help in their country:** the helplines in [section 4](#4-what-ward-does-when-it-sees-danger),
   and Find A Helpline.
4. **Reduce exposure.** If a post on GitHub names a child, shows a chat, or contains images, hide
   or edit it at once (GitHub lets maintainers minimise comments and delete content), and report
   it to GitHub if it needs removing from history.
5. **Decide on reporting.** If a child may be in immediate danger, or there is a legal duty to
   report where the safeguarding lead lives, the lead contacts the relevant authority or
   helpline. We usually will not know who or where the person is. The lead records what is and is
   not possible. `[Decision needed: which reporting duties apply, with legal advice]`
6. **Keep a minimal record.** What was reported, when, what we did. Not the child's story beyond
   that. Records are held by the safeguarding lead only, and deleted after `[retention period:
   to be decided with advice]`.

**Child sexual abuse material.** If anyone posts or links child sexual abuse material (CSAM) in
the repository: do not open it, do not copy it, do not forward it. Report the link to the
relevant hotline (the Internet Watch Foundation, or NCMEC's CyberTipline, or the national
equivalent) and to GitHub, remove the content from view, and tell the safeguarding lead. We will
never ask a contributor to produce or share such material for any reason, including to "train
the detector". Ward Annotate would not touch it.

**A third-party concern about a child who uses Ward** (a teacher, parent or helpline worker
contacts us). We cannot identify the child and will say so. We point them to the helpline and,
where the adult is in a position to act, to their own organisation's safeguarding process.

## 8. What Ward will never do

These are commitments. If we ever want to change one, it needs a public discussion and the
agreement of the safeguarding lead, and the change is announced in the README.

- Send a child's chats, evidence, answers, name or age to any server, company or person.
- Contact a parent, school, platform, helpline or the police for the child, automatically or
  otherwise.
- Offer a parent, teacher or any other adult a way to read a child's chats, see their checks or
  receive alerts. No parent dashboard, no remote view.
- Read messages from other apps automatically (accessibility or notification listeners). The
  child shares a chat in.
- Guess who is behind an anonymous account, by writing style or any other method.
- Collect analytics, advertising identifiers or telemetry, or show ads.
- Sell, rent or share data about children. (We have none.)
- Use a child's chat to train a model. Training uses public data and synthetic chats only. Ward
  Annotate, if built, will keep to that.
- Use streaks, rewards or notifications to pressure a child, or to bring them back when they
  have not chosen to return.
- Ask for a child's real name, location, school, phone number or contact list. The name field is
  a nickname and stays on the device.
- Tell a child they are overreacting.
- Require payment or an account.

## 9. Research and pilots

Children's data is not collected by the app, but a pilot would still involve children. Before
any pilot:

- Ethics approval from a recognised review board, in the country where the pilot runs.
- Informed consent from parents or guardians and assent from the children, in plain language.
- A named safeguarding lead at each school or partner, and a written route for any child who
  becomes distressed. The pilot's own safety log is described in
  [ROADMAP.md](ROADMAP.md#stage-1-feasibility-pilot-3-to-5-schools-one-city-one-school-term).
- Outcomes come from anonymous school surveys, teachers' logs and caseworker ratings. The app
  still sends nothing.
- Results published, good or bad.

## 10. Raising a concern about the project itself

If you think Ward, or someone involved in it, is putting a child at risk, or this policy is not
being followed:

- **Something in the app is unsafe or wrong** (a wrong helpline number, harmful wording, a way
  Ward could expose a child): open an issue, or if it could expose a child's data, use
  [private vulnerability reporting](../SECURITY.md).
- **Something about a person in the project** (a maintainer, volunteer or advisory group
  member): write to `[safeguarding contact address: to be created]`. If you are not comfortable
  writing to the lead, write to `[second contact, outside the maintainer group: to be named]`.
- **A child is in immediate danger:** contact your local emergency number or child helpline first.
  Do not wait for us.

We will acknowledge a concern within `[number: for example 3 working days]` and tell you what we
decided. Nobody will be penalised for raising a concern in good faith. Concerns about a
maintainer are handled by someone other than that maintainer.

## 11. People who work with the project

Anyone with contact with young people through the project (youth advisory group moderators,
Ward Annotate moderators, pilot staff) must:

- Have a **background check appropriate to their country** (for example a DBS check in the UK, or
  the local equivalent), arranged and recorded by the safeguarding lead. **Planned.**
- Read and sign this policy and the code of conduct.
- Never be alone in private contact with a young person. Use group channels with at least two
  adults, or a channel the safeguarding lead can audit.
- Never ask a young person for personal details beyond what the activity needs.
- Report any concern to the safeguarding lead the same day.

Maintainers who only write code and have no contact with young people do not need a background
check, but they do read this policy.

## 12. Training and review of this policy

- The safeguarding lead and every maintainer read this policy when they join and again at each
  review. **Planned:** short safeguarding training for the lead from a recognised provider.
- This policy is reviewed **at least once a year**, and after any serious incident, any new
  feature that touches what a child sees or types, and any change to the "never do" list.
- Changes to this policy are made by pull request. The safeguarding lead must approve; the
  maintainers cannot merge a change to it alone.

## Review status

| Item | Status |
| --- | --- |
| Reviewer | `[safeguarding professional: to be found]` |
| Reviewer's qualification and organisation | `[to be recorded with their consent]` |
| Date reviewed | `[pending]` |
| Changes the reviewer asked for | `[pending]` |
| Version | Draft 0.1 |

Until the first four rows are filled in, the banner at the top of this document stays.
