# Digital Public Goods application (draft)

> **DRAFT. Not yet reviewed by a safeguarding professional, and not yet submitted.** This is a
> working draft of Ward's application to the [Digital Public Goods Alliance](https://digitalpublicgoods.net)
> (DPGA). It was written to be honest first and persuasive second. Several indicators below are
> only partly met or not yet met, and they are marked that way. A qualified safeguarding reviewer
> must read the sections on indicators 9a to 9c, and a lawyer should read indicator 7, before
> anything is submitted. See [SAFEGUARDING.md](SAFEGUARDING.md#review-status).

## About the standard

The DPG Standard has nine indicators (9 has three parts). The DPGA's GitHub repository lists the
current release as **v1.1.6** (September 2024). Its changelog adds a question about clear
ownership for content collections and data sets. The text of the indicators below is paraphrased from
the [standard](https://github.com/DPGAlliance/DPG-Standard) and the
[submission guide](https://digitalpublicgoods.net/submission-guide/), which we read on
2026-10-31. **Check both again before submitting**: the standard is revised, and the application
form at [app.digitalpublicgoods.net](https://app.digitalpublicgoods.net/signup) is the authority.

Process, from the submission guide: an optional eligibility test; gather evidence for each
indicator; an **authorised representative** of the solution submits through the DPGA application
portal; the DPGA technical review team assesses it (they aim for about 30 days); if every
requirement is met, the solution is listed on the DPG Registry, and status is renewed every year.
What is submitted becomes public under the Unlicense, except the submitter's name and contact
details.

## Summary

Ward is an offline anti-cyberbullying app for children, with the lessons, stories, school kit,
report format and viewer that go with it. It is MIT licensed and has no server and no data
collection.

| # | Indicator | Status | One line |
| --- | --- | --- | --- |
| 1 | SDG relevance | **Met** | SDG 16.2, with 4.a and 3.4. Target and indicator wording to confirm against the UN list. |
| 2 | Approved open licence | **Partly met** | Software is MIT. Lesson, story and audio content, and the licences of the AI models and datasets we rely on, need clarifying. |
| 3 | Clear ownership | **Partly met** | Copyright holder is named in `LICENSE`. No trademark policy, no contributor terms, audio and synthetic data ownership not yet written down. |
| 4 | Platform independence | **Partly met** | The core runs with no closed component. Gemma's licence terms, the Hugging Face download and the bundled ElevenLabs audio need a written answer. |
| 5 | Documentation | **Partly met** | README, plan, harms, report format and training data card exist. No contributor guide or per-platform build and release guide. |
| 6 | Extracting data and content | **Met** | No PII server-side. Content and exports are plain JSON, CSV, HTML and text, with the report format documented. |
| 7 | Privacy and applicable laws | **Not yet met** | The design is private by construction, but the indicator needs a written statement from an authorised person and a legal review. |
| 8 | Standards and best practices | **Partly met** | Uses open standards for crypto, data and formats. No accessibility audit, no external child-safety framework mapped, no independent security review. |
| 9a | Data privacy and security | **Met** (self-assessed) | Collects no PII. Vault encryption is documented. No independent review yet. |
| 9b | Inappropriate and illegal content | **Partly met** | Policy for what reaches the project drafted; not yet published, reviewed or tested. |
| 9c | Protection from harassment | **Partly met** | Code of conduct and safeguarding policy drafted; the safeguarding lead and the checks are not in place. |

## Indicator by indicator

### 1. Relevance to the SDGs

**Requirement.** Show that the good contributes to advancing the UN Sustainable Development
Goals, linked to specific targets.

**Ward.** Cyberbullying is a form of violence against children, and a barrier to learning.

- **SDG 16, target 16.2**: end abuse, exploitation, trafficking and all forms of violence against
  and torture of children. Ward helps a child recognise online abuse, keep evidence, reach a
  trusted adult or helpline, and recover. This is the primary goal.
- **SDG 4, target 4.a**: build and upgrade education facilities that provide safe, inclusive
  and effective learning environments. The SDG indicator under this target measures students
  experiencing bullying. Ward's class mode, lessons and school kit are made for schools.
  *Confirm the exact indicator number and wording from the UN SDG indicator list before
  submitting.*
- **SDG 3, target 3.4**: promote mental health and wellbeing. Ward's "Bounce back" unit, safety
  plan and helpline links.

The application should name only the most relevant goals, so we propose 16.2 and 4.a, with 3.4
as secondary.

**Evidence.**
- [README.md](../README.md#what-this-is-and-what-it-isnt) and [ROADMAP.md](ROADMAP.md): the problem
  (World Solve WS05937), the evidence, and an honest account of what Ward does not do.
- [PLAN.md](PLAN.md): how the design answers each part of the problem.
- [`eval/results/scorecard.md`](../eval/results/scorecard.md): measured detection, which is not
  the same as proving outcomes for children.

**Gap.** No evidence yet that children are better off. A pilot is planned (ROADMAP,
[measurement plan](ROADMAP.md#measurement-plan)). We say so in the application.

### 2. Use of approved open licences

**Requirement.** Software under an OSI-approved licence. Content under a Creative Commons
licence. Data under an Open Data Commons licence.

**Ward.**
- **Software: met.** [`LICENSE`](../LICENSE) is the MIT licence, which is OSI-approved. Desktop's
  `package.json` also declares `MIT`.
- **Content: unclear.** The lessons, stories, adult guide, school kit and the pack word lists
  are in the same repository under the MIT licence. MIT is a software licence and does not cover
  creative text well. `[Decision needed: keep MIT for everything, or add a Creative Commons
  licence (for example CC BY-SA 4.0) for lessons, stories, the school kit and translations, so
  schools and translators know what they can do.]`
- **Audio: unclear.** The English read-aloud clips (107) were generated with ElevenLabs and are
  bundled. Their licence terms under the plan used must permit open redistribution.
  `[Decision needed: check ElevenLabs' terms; state the licence for the audio files.]`
- **AI models.** Ward does not ship Gemma. A person installs Gemma 4 through Ollama, or the phone
  downloads the 2 GB Gemma 4 E2B file by choice. Earlier Gemma releases used Google's Gemma
  Terms of Use, which are not OSI-approved. `[Decision needed: confirm the licence of the Gemma
  4 and ShieldGemma versions Ward uses before claiming anything about them.]`
- **Ward Lite model.** 37.7 MB, built on `intfloat/multilingual-e5-small`
  ([`apps/web/public/models/ward-lite/ward-lite.json`](../apps/web/public/models/ward-lite/ward-lite.json)).
  `[Decision needed: confirm that model's licence and state the licence of Ward Lite itself.]`
- **Training data.** The model is trained on public datasets and synthetic chats; the sources
  are listed in [`train/DATA.md`](../train/DATA.md). `[Decision needed: record each dataset's
  licence, and confirm that using it to train and then redistributing the resulting model is
  allowed.]`

**Evidence.** [`LICENSE`](../LICENSE).

**Status: partly met.** The software qualifies. The application should not be submitted until the
content, audio, model and training data questions have a written answer.

### 3. Clear ownership

**Requirement.** Clearly define and document who owns the assets the good produces (copyright,
trademarks or other public information). v1.1.6 also asks this for content collections and data
sets.

**Ward.**
- **Copyright.** [`LICENSE`](../LICENSE) names the holder: "Copyright (c) 2026 Muhammad Murtuza
  Hussain".
- **Contributions.** There is no `CONTRIBUTING.md`, no contributor licence agreement and no
  Developer Certificate of Origin. In practice contributions are accepted under the repository's
  MIT licence, but that is not written down. `[Decision needed: add a CONTRIBUTING.md saying
  contributors keep their copyright and license their work under the repository licence, or adopt
  the DCO.]`
- **Name and mark.** "Ward" is a common word and may already be in use by others as a product
  name. No trademark search has been done and there is no trademark policy. `[Decision needed:
  search; decide whether to register or to state that the name is used descriptively; write a
  short policy on forks using the name.]` The ghost icon is original to the project
  (`mobile/assets/icon-only.png`); its rights holder should be stated.
- **Content.** Lessons, stories and translations are written by the project. Translations by
  language maintainers should keep their authors' attribution
  ([GOVERNANCE.md](GOVERNANCE.md#language-maintainers)).
- **Synthetic data and audio.** Who owns text written by Gemma and audio made by ElevenLabs
  depends on those services' terms. `[Decision needed: record the answer.]`
- **Governance.** A steward and, later, an organisation. See [GOVERNANCE.md](GOVERNANCE.md).
  `[Decision needed: who is the authorised representative for the application, and which
  organisation, if any, owns the project.]`

**Status: partly met.**

### 4. Platform independence

**Requirement.** If mandatory dependencies on closed components add restrictions beyond the
original licence, show independence from them, or open alternatives that work without significant
changes to the core product.

**Ward.**

| Component | Open or closed | Mandatory? | Notes |
| --- | --- | --- | --- |
| Engine: parser, slang packs, pattern engine, report builder (`packages/engine`) | Open (MIT, TypeScript) | Yes, and sufficient | Runs on any phone with no network and no model. |
| Ward Lite (ONNX, via Transformers.js and ONNX Runtime Web) | Open model, open runtimes | No | Adds warnings only; the app works without it. |
| Gemma 4 and ShieldGemma via Ollama | Open weights, licence to confirm; Ollama is open source | No | Optional "close read" on a computer. Any model Ollama can run can be set in Me. |
| Gemma 4 E2B on Android via LiteRT-LM | Open weights, licence to confirm; runtime from Google's AI Edge project | No | Optional download by the child; drafts and lesson feedback only. |
| Hugging Face | Hosting service | No | Hosts the optional 2 GB phone model file. `[Decision needed: whether to mirror it elsewhere.]` |
| ElevenLabs | Closed service | **No, at runtime** | Used once to make 107 English audio clips, which are bundled as plain MP3 files. The app makes no call to ElevenLabs. Replacements: device text-to-speech (already used for Urdu) or any open TTS. |
| Android and Capacitor, Electron | Open source frameworks | Yes, for each shell | The web app also runs in a browser. A fork could use any shell. |
| Google Play, App Store | Closed distribution | No | Ward is distributed as an APK and desktop installers on GitHub. F-Droid is planned. |
| Operating systems (Android, macOS, Windows, Linux) | Mixed | Not controlled by us | Normal for apps. |

The test is whether the core product works without the closed parts. It does: the word lists,
patterns, lessons, stories, vault, report and viewer need none of them.

**Evidence.** [README.md](../README.md#how-its-built), [PHASES.md](PHASES.md#partner-technologies)
(which lists what each partner technology is for and what is "not used, on purpose"),
`packages/engine/package.json`, `apps/web/package.json`.

**Gap.** A written statement, by someone technical, on Gemma's licence and on the
ElevenLabs-generated audio. Also, a few partner services in PHASES.md are "planned" (DigitalOcean,
Render, Browserbase, SerpApi) and must be kept optional if they are adopted.

**Status: partly met.**

### 5. Documentation

**Requirement.** For software: technical documentation that lets an unfamiliar technical person
launch and run it. For content collections: usage instructions and compatible apps. For data
projects: describe the fields, how the data was collected and how to interpret it.

**Ward.**
- **Run and build:** the "Run it" section of [README.md](../README.md#run-it) (install, dev
  server, tests, scorecard, desktop and Android builds).
- **Architecture:** [PLAN.md](PLAN.md) (layout, platforms, scope cuts) and the README's
  [How it's built](../README.md#how-its-built).
- **Use cases and requirements:** [PLAN.md](PLAN.md), [PHASES.md](PHASES.md),
  [ROADMAP.md](ROADMAP.md).
- **Risks:** [HARMS.md](HARMS.md).
- **Data formats:** [REPORT.md](REPORT.md) documents `ward.report/v2` field by field, including
  how to verify the digest by hand.
- **Training data:** [`train/DATA.md`](../train/DATA.md) lists sources, split, counts, labels and
  known weaknesses; [`train/README.md`](../train/README.md) covers the pipeline.
- **Evaluation:** [`eval/results/scorecard.md`](../eval/results/scorecard.md) and
  `pnpm eval`.
- **Slang packs:** each pack states its source in its `about` field.
- **Tests and CI:** `.github/workflows/ci.yml` runs typecheck, tests and a build on every push;
  `desktop.yml` and `android.yml` build and launch-test the installers and the APK.

**Gaps.**
- No `CONTRIBUTING.md`, no guide for adding a slang pack or a language, and no guide for
  translating lessons. (A language-maintainer guide is implied by [GOVERNANCE.md](GOVERNANCE.md).)
- No step-by-step release or signing guide for the desktop and Android builds.
- No end-user manual beyond the in-app text.
- No documented learning outcomes for the lessons.

**Status: partly met.**

### 6. Mechanism for extracting data and content

**Requirement.** For systems without PII, export or import of non-PII data and content in a
non-proprietary format.

**Ward.** Ward has no server and holds no PII on any server. Content and exports use open formats:

- **Slang packs, lessons and stories** are plain JSON in the repository (`packages/engine/packs`,
  `packages/lessons/src`). They can be read, edited and reused directly.
- **Reports** are produced as `ward-report.json` (a documented, versioned schema) and a
  readable HTML page ([REPORT.md](REPORT.md)).
- **The case viewer** exports a plain-text summary, a CSV (with spreadsheet formulas
  neutralised) and a print view.
- **The school kit** lets a teacher download class totals as CSV. Nothing about any child is in
  them.
- **The scorecard** is published as Markdown and JSON.
- **Chat input** is a standard WhatsApp text export, pasted text or an image.

What a child saves in the vault is personal data and is encrypted on their device. It is
deliberately not exportable in bulk; the child can make a report from it. This is by design and
consistent with the indicator, which is about non-PII data.

**Evidence.** [REPORT.md](REPORT.md), `viewer/ward-viewer.html`, `eval/results/scorecard.json`,
`packages/lessons/src`.

**Status: met.**

### 7. Adherence to privacy and applicable laws

**Requirement.** Show the good is designed and developed to comply with privacy and other
applicable laws. The evidence must come from someone authorised to speak for the project, with
their title, name and contact information. The submission guide asks, if personal data is
collected, for a link to the privacy policy or terms, and encourages listing the laws that
apply.

**Ward.** By design, Ward collects no personal data: no account, no server, no analytics, no
telemetry. A child's chats are read on the device and forgotten unless saved, and saved
evidence is encrypted. This is the strongest privacy position available, and it is described in
[README.md](../README.md), [HARMS.md](HARMS.md) and [SAFEGUARDING.md](SAFEGUARDING.md).

**What is missing.**
- **No privacy policy or terms of use** document. Even an app that collects nothing should say
  so, in plain language for a child and in full for an adult. `[Decision needed: write
  docs/PRIVACY.md; have a lawyer check it.]`
- **No legal review.** The laws that may apply depend on where the app is used. The ones to
  assess include, at least: the EU General Data Protection Regulation (including rules on
  children's consent), the UK Children's Code (Age Appropriate Design Code), the US Children's
  Online Privacy Protection Act, and Pakistan's, India's and Bangladesh's data-protection and
  cyber-crime laws. `[Decision needed: obtain a legal opinion for the countries Ward is aimed
  at. Do not assert compliance with any law until a lawyer has said so.]`
- **No statement from an authorised person**, which the indicator requires. `[Authorised
  representative: name, title and contact to be supplied.]`
- Some network calls exist (the optional Ollama computer, the optional model download, helpline
  links). They carry no chat, but a privacy policy must describe them.

**Status: not yet met.** The design supports it; the paperwork does not exist. This indicator
needs work before submission.

### 8. Adherence to standards and best practices

**Requirement.** Designed and developed in line with relevant standards, best practices and
principles.

**Ward.**
- **Open standards and formats:** AES-GCM, PBKDF2 and SHA-256 for the vault and report integrity
  (via the Web Crypto API); ISO 8601 times; JSON; ONNX for the model; UTF-8 text; QR codes;
  standard WhatsApp exports.
- **Engineering practice:** TypeScript with strict typechecking, unit tests (engine, lessons,
  stories, report, viewer, school kit, QR transfer), CI on every push, installers built and
  launch-tested in CI, a content-security policy and permission handler in the desktop app, and
  a case viewer that cannot make network requests.
- **Privacy by design and data minimisation:** the "never do" list in
  [SAFEGUARDING.md](SAFEGUARDING.md#8-what-ward-will-never-do), reflecting practice in the UN
  Convention on the Rights of the Child (the child's best interests and right to privacy).
- **Accessibility and inclusion:** an accessibility-first typeface (Atkinson Hyperlegible Next),
  right-to-left Urdu in a Nastaliq font, read-aloud, a gender-neutral design, low-resource
  hardware targets, and an offline-first approach.
- **Evidence-informed:** the roadmap cites the intervention research
  ([ROADMAP.md](ROADMAP.md#sources)) and treats it honestly, including that app-only
  interventions have thin evidence.
- **Open source practice:** a public changelog in git, issues, a code of conduct and a security
  policy (drafts).

**Gaps, stated plainly.**
- No accessibility audit against WCAG, or against a mobile accessibility standard. `[Planned.]`
- No independent security review or penetration test. `[Planned.]`
- No mapping to a child-safety framework (for example the UK Children's Code, UNICEF's guidance
  on children and AI, or a national standard). `[Planned.]`
- Safe-messaging guidance for suicide and self-harm content is not yet named or checked by a
  qualified person ([SAFEGUARDING.md](SAFEGUARDING.md#5-how-content-is-written-and-reviewed)).
- No content review by a child-protection professional yet.
- Ward Annotate (community labelling) and the red-team set, which would strengthen best practice
  on model evaluation, are not yet built ([PHASES.md](PHASES.md#phase-5-proof-and-staying-alive)).

**Status: partly met.**

### 9. Do no harm by design

**Requirement.** Show the good is designed to anticipate, prevent and avoid harm. It has three
parts, each of which applies if the system does the thing named.

#### 9a. Data privacy and security

**Requirement.** For systems that collect, store or distribute PII, show how privacy, security
and integrity are ensured.

**Ward.** The project collects, stores and distributes no PII. On the child's own device:

- the vault is AES-GCM encrypted with a key from a PIN (PBKDF2, 310,000 rounds); the PIN is not
  stored; the safety plan, case notes and evidence share that seal;
- each person on a shared phone has their own database, an optional PIN, and a quick exit that
  locks Ward at once, hides it from the recents screen on Android (`FLAG_SECURE`) and, on
  desktop, can be triggered by pressing Escape twice;
- Android cloud backup is off (`android:allowBackup="false"`);
- the desktop app refuses every permission except the camera for scanning;
- reports carry a SHA-256 digest and a per-message fingerprint, so tampering is detectable
  ([REPORT.md](REPORT.md#checking-a-report)).

[HARMS.md](HARMS.md) lists what can go wrong with Ward's own data and what we do about it,
including that a short PIN can be brute-forced by a determined person with the device.
[SECURITY.md](../SECURITY.md) describes how to report a flaw privately.

**Gaps.** No independent security review. Android allows cleartext traffic so the phone can reach
a family computer's Ollama; this is documented in [SECURITY.md](../SECURITY.md) and should be
tightened.

**Status: met, self-assessed.** The honest wording for the application is "collects no PII; the
protections for the data on the device are documented but have not been independently audited."

#### 9b. Inappropriate and illegal content

**Requirement.** For systems that collect, store or distribute content, have policies that
identify inappropriate and illegal content (such as child sexual abuse material) and processes
to detect, moderate, report and remove it.

**Ward.** Ward does not collect or distribute user content. The app handles messages only on the
device. The project does host a public repository, which accepts issues and pull requests. It
also contains slang packs and test fixtures that include abusive words. Where it applies:

- [SAFEGUARDING.md](SAFEGUARDING.md#7-disclosures-and-concerns-that-reach-the-project) says what
  to do when someone posts a real child's chat, a disclosure, or child sexual abuse material:
  do not open it, report it to the national hotline and GitHub, remove it from view, tell the
  safeguarding lead.
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) forbids putting a real child's data into the
  project.
- The ways the app can contain harmful content of its own are covered by content rules, a review
  process and the models' limits in [SAFEGUARDING.md](SAFEGUARDING.md#5-how-content-is-written-and-reviewed).

**Gaps.** These are drafts, not published and not reviewed. No issue templates yet warn people
not to paste real chats. No named safeguarding lead to act on a report. No tested process.

**Status: partly met.**

#### 9c. Protection from harassment

**Requirement.** If the good enables interaction between users or contributors, have a process
for protecting them from griefing, abuse and harassment, and systems addressing the safety and
security of underage users.

**Ward.** The app has no chat, messaging or social feature between users, so there is nothing for
users to harass each other with. Contributors interact in the repository, and young people may
take part in a future advisory group and in Ward Annotate. Underage users' safety is the reason
Ward exists. What we have drafted:

- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md): the Contributor Covenant 2.1 plus rules for
  a project that serves children, with a private reporting route.
- [SAFEGUARDING.md](SAFEGUARDING.md): the policy, including the checks for adults who work with
  young people and the "never do" list.
- [GOVERNANCE.md](GOVERNANCE.md): the safeguarding lead role, the safeguarding veto, and the
  protections for the youth advisory group.
- In the app, age bands, shared-phone profiles with a quick exit, and a danger path that puts
  helplines first ([SAFEGUARDING.md](SAFEGUARDING.md#4-what-ward-does-when-it-sees-danger)).

**Gaps.** The safeguarding lead is not appointed. No one has done a background check. The youth
advisory group does not exist. None of the documents has been reviewed by a qualified person.

**Status: partly met.**

## What to do before submitting

In order of how much they block the application:

1. Appoint the safeguarding lead and have the safeguarding documents reviewed; publish them.
2. Write a privacy policy; get a legal read for the countries Ward is aimed at; name the
   authorised representative (indicator 7, and the submitter role).
3. Settle licensing: content licence, audio, the Gemma and Ward Lite models, training-data
   licences (indicator 2, 4).
4. Add `CONTRIBUTING.md`, a trademark and name statement, and a plain statement of ownership
   (indicator 3, 5).
5. Switch on GitHub private vulnerability reporting; add issue templates (9b).
6. Run the eligibility test on the DPGA site, then re-read the current standard and form.
7. Fill in the online application using this document as source material. Keep the answers
   public-safe: the DPGA publishes them.

## Placeholders in this file

- Authorised representative for the application: name, title, contact.
- Licence decisions: content (lessons, stories, kit), audio, Ward Lite, Gemma and ShieldGemma
  versions, each training dataset.
- Trademark search and name policy.
- Whether and where to host the repository in an organisation.
- Which laws apply, and a legal reviewer.
- Mirroring the optional phone model.
