# Security policy

> **DRAFT. Not yet reviewed by a safeguarding professional.** The contact details and response
> times below are placeholders until the project has people to answer them. See
> [docs/SAFEGUARDING.md](docs/SAFEGUARDING.md).

Ward is used by children who are being hurt online, on phones that are sometimes shared. A
security flaw here is not only a technical problem. It can mean a child's evidence is read by the
person hurting them. Please take that seriously, and thank you for helping.

## How to report a vulnerability

**Please report privately. Do not open a public issue, pull request or discussion.**

Use GitHub's private vulnerability reporting: on the repository page, open the **Security** tab,
choose **Report a vulnerability** and fill in the form. Only the maintainers can see it.

> Setup note for maintainers: private vulnerability reporting must be switched on under
> Settings, then Code security, in the repository. Until it is, use the fallback below.
> `[Decision needed: confirm it is enabled before publishing this file.]`

If you cannot use GitHub, write to `[security contact address: to be created]`. Do not include a
real child's data in a report. Use made-up data or a test profile.

A good report says what you found, how to reproduce it (a made-up chat is enough), which version
or platform (Android, desktop, web) you used, and what you think the impact is.

## What happens next

These are targets, not guarantees, from a very small team:

| Step | Target |
| --- | --- |
| We reply to say we have it | within `[number: for example 5 days]` |
| We tell you whether we agree it is a vulnerability | within `[for example 14 days]` |
| We fix serious problems | as soon as we can; we will tell you if it will take longer than `[for example 30 days]` |
| We publish an advisory and credit you | after a fix is released, if you want credit |

We will not take legal action against anyone who finds and reports a problem in good faith,
keeps to this policy, does not look at or keep anyone's real data, and gives us reasonable time
to fix it before telling others.

There is no bug bounty. `[Decision needed: whether to offer any recognition or reward.]`

## What is in scope

Anything that could put a child's data or safety at risk, in the code in this repository. In
particular, anything that could:

1. **Leak a child's data off the device.** A chat, a check result, a name, an age band, an
   answer to a lesson, a saved piece of evidence, a report, a PIN or a profile, going anywhere
   the child did not choose. That includes through the network, a log, a crash report, a
   clipboard, a share intent, a screenshot or the recents screen.
2. **Open the vault without the PIN**, or weaken it: AES-GCM with a key from the PIN (PBKDF2,
   310,000 rounds), the PIN hash, the lock after quick exit, one profile reading another's data
   on a shared phone, or `delete everything` not deleting everything.
3. **Make Ward send something the child did not send.** Any path where Ward contacts a person,
   service or server by itself with the child's content.
4. **Break the report's integrity check**: producing a `ward-report.json` or a case in the
   viewer or counsellor mode that passes verification after being edited (see
   [docs/REPORT.md](docs/REPORT.md)).
5. **Run code or make network requests in the case viewer** (`viewer/ward-viewer.html`), which
   is meant to be one offline file with a content-security policy that blocks every request, or
   in counsellor mode, including through a crafted report or QR code. Report content must only
   ever be shown as text.
6. **Escape the app's sandbox or permissions**: the desktop app's permission handler (it allows
   only the camera, for scanning), the Android plugins (`ShareIn`, `Privacy`, `GemmaPhone`) and
   their handling of shared files, Electron's `app://ward` origin, or the Android manifest
   (backup, exported components, file provider).
7. **Weaken the safety behaviour**: a way to make a dangerous message be shown as safe, to
   suppress the help block, or to lower a verdict the word lists call dangerous, other than by
   ordinary false negatives (those belong in a normal issue; see
   [docs/HARMS.md](docs/HARMS.md)).
8. **A supply-chain problem**: a dependency, build step or workflow in `.github/workflows` that
   could ship altered code or a tampered model to children.
9. **Read-aloud, QR transfer or model-download paths** that can be tricked into fetching or
   running something unexpected.

## What is out of scope

- A person with full, unlocked access to an unlocked phone reading what is on it. The PIN is a
  lock against a sibling or classmate, not against a forensic lab
  ([docs/HARMS.md](docs/HARMS.md#ward-handles-something-it-shouldnt-handle-alone)); a four-digit
  PIN can be brute-forced by someone with the device and time. Reports that improve this are
  welcome as ordinary issues.
- Ward missing a piece of bullying, or calling banter bullying. Those are accuracy problems.
  Please open a normal issue, with made-up examples, and see the scorecard.
- Problems in a third-party service or model that we do not control (Ollama, Gemma, Hugging Face,
  the operating system). Tell their maintainers. If our use of them is the problem, tell us.
- Findings that need a rooted or jail-broken device, or malware already on the device, unless
  Ward makes the situation worse.
- Reports from automated scanners with no demonstrated impact.
- Social engineering, physical attacks on maintainers, or denial-of-service tests against
  GitHub or other services.

## Known design choices worth knowing about

So you do not spend time rediscovering them:

- The Android app declares the `INTERNET` permission and allows cleartext traffic. That is so a
  phone can reach the family computer's Ollama over home Wi-Fi (`http://<address>:11434`) when
  the child sets that up. By default Ward talks only to `127.0.0.1`. A report that shows traffic
  to anywhere else without the child's action is in scope; the choice itself is under review, and
  tightening it is welcome.
- On Android, the optional phone model (about 2 GB) is downloaded from Hugging Face when the
  child chooses to. That download must not carry chat data.
- Cloud backup is off on Android (`android:allowBackup="false"`), on purpose.
- The desktop installers are unsigned for now.

## Supported versions

Only the latest release is supported. `[Decision needed: policy once there are several
releases.]`

## Disclosure of safeguarding concerns

If what you found is not a vulnerability but a risk to a child (for example, wording that could
harm, or a wrong helpline number), say so. Use a public issue if no child's information is
involved, or write to the address in [docs/SAFEGUARDING.md](docs/SAFEGUARDING.md#10-raising-a-concern-about-the-project-itself).
