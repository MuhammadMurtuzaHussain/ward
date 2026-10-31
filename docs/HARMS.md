# What could go wrong with Ward

World Solve problem WS05937 asks that any intervention for cyberbullying "identify possible
harms". These are the ones we could think of, how likely they are, and what Ward does about each.
If you find another, please open an issue.

## Ward gets it wrong

**It misses bullying (a false negative).** A child is being hurt and Ward says "This looks okay".
This is the most serious failure, because it can make a child doubt their own feelings.

- Every "looks okay" result ends with: *"If it still feels wrong, trust that feeling and tell
  someone."* Ward never tells a child they're overreacting.
- Bullying that uses no rude words (exclusion, ignoring, inside jokes) is the hardest case. The
  pattern engine catches exclusion phrases and removals from groups, and Gemma reads context, but
  coded bullying in a language or slang Ward doesn't know will get through. The scorecard
  (`eval/results/scorecard.md`) shows where: Bangla and English tweet datasets are much harder
  than Roman Urdu.
- Slang packs are plain JSON so the people who know the words (teachers, youth workers, kids
  themselves) can add them.

**It calls banter bullying (a false positive).** Two friends teasing each other get told it's
bullying. This mostly costs trust in the app.

- With Gemma running, friendly teasing between people who both join in scores zero (tested in
  `engine.test.ts`, "a model that reads banter as friendly turns the pack hits off").
- Without a model, single rude words only reach "Keep an eye", never "Bullying". "Bullying" needs a
  pattern: the same person again and again, a pile-on, ghost accounts, exclusion.
- Dangerous words ("kys", "mar ja") stay visible even when Gemma reads them as a joke, with
  *"It may be a joke, but these words are serious. How did it feel?"* We chose a visible, gentle
  flag over silence.

**It blames the wrong person.** In a group chat, Ward might count someone as a bully who was
quoting a bully or standing up for the victim.

- Gemma is told that standing up for someone and talking about a bully are not hostile.
- People with no hostile messages are listed as "Not part of it", so an upstander isn't lumped in.
- Ward never names anyone outside the app, never sends anything, and never guesses who is behind
  an anonymous account (see below).

## Ward is misused

**A parent uses it as spyware.** Someone takes a child's phone, exports their chats, and reads
them through Ward.

- Ward shows nothing that WhatsApp's own export doesn't already contain; it adds no access.
- There is no parent mode, no remote view, no alerts to anyone. Ward's promise in onboarding is
  that nobody reads the child's chats, and the design keeps it: nothing leaves the device.
- Saved evidence is encrypted under a PIN only the child knows.

**A bully uses it to check their messages get past it.** Someone tunes insults until Ward stops
flagging them.

- Possible, as with any open filter. Ward doesn't moderate a platform, so passing Ward changes
  nothing for the bully: the child still sees the message and still decides what it was.

**Someone uses it to unmask an anonymous account.** We deliberately did not build writing-style
matching. It could falsely accuse a child, and it would de-anonymise minors. Ward says "these
accounts showed up and only attacked"; it never says who it thinks they are.

## Ward handles something it shouldn't handle alone

**Self-harm and threats.** A chat says "kill yourself", or threatens violence or sharing images.

- Ward's level becomes "Get help now", and helplines for the child's country appear at the top
  of the result and on the coach page, with emergency numbers. Numbers were checked against Child
  Helpline International and national sources on 2026-10-29 (`apps/web/src/lib/help.ts`).
- Ward still sends nothing by itself. We weighed an automatic alert and rejected it: a child who
  learns the app will tell on them stops using it, and then it can't help anyone. The child is
  told this rule up front in onboarding.

**Sextortion.** Threats to share images, demands for money or more photos.

- The coach says, in bold: stop replying, never pay. The result links Take It Down
  (takeitdown.ncmec.org), which removes images of under-18s, including ones they sent themselves.

## Ward's own data

**Someone finds the phone and reads the vault.** The vault is AES-GCM encrypted with a key from
the PIN (PBKDF2, 310,000 rounds). The PIN isn't stored. A four-digit PIN can be brute-forced by a
determined adult with the device; it's a lock against a sibling or a classmate, not a forensic lab.

**Cloud backup copies it off the device.** Android backup is turned off for Ward
(`android:allowBackup="false"`), so nothing goes to a Google account.

**Ward forgets something the child needed.** Checks that aren't saved disappear when Ward closes;
that's the privacy promise. Every result has "Save as evidence" next to "What do I do?" so saving
is one tap away. "Forgot my PIN" means deleting the vault: there is no recovery, by design.

## Ward for Discord

Personal mode in Discord works like the app: a teen checks or saves a message and only they see
the answer. Server mode is different. It is a moderator tool, off by default, and the one place
Ward alerts adults. Its policy is [SAFEGUARDING.md section 13](SAFEGUARDING.md#13-ward-for-discord).

**Adults get alerts the child never chose.** Everything in the app is built around Ward telling
nobody. Server mode tells a server's moderators about dangerous messages.

- It runs only when the host sets `WARD_SERVER_MODE=on` and a server creates a private
  `#ward-alerts` channel. Without the setting, the bot can't read server messages at all.
- It must not be offered publicly until a safeguarding reviewer has signed it off. The project's
  own hosting file keeps it off.

**A child telling what happened is treated as the bully.** "someone told me to kys" and "stop
telling Sara to kys" carry the same words as the abuse, so the word lists flag them.

- Before any nudge or check-in, Ward looks for someone telling what was said to them ("told me",
  "mujhe kaha", "আমাকে বলেছে") or standing up for someone ("stop telling ..."). Then the writer
  gets no nudge, nobody they mention gets a check-in (they are often the bully), and moderators
  only hear that someone may need support, with the link.
- The check is narrow and misses some. Ward never nudges the sender of a dangerous message at
  all, so a disclosure Ward misses is still never told to delete itself.

**A disclosure is copied to adults.** A message about self-harm may be a child asking for help.
Those alerts carry the link, the channel and the kind only, never the words or a name, and so do
dangerous messages Ward can't name a kind for.

**Alerts outlive the moment.** Ward keeps nothing, but an alert is a Discord message that stays in
`#ward-alerts` until a moderator deletes it. Moderators are told this in `/ward server`.

**A nudge tips off someone making threats.** Ward nudges only the senders of hurtful messages,
never dangerous ones, so nobody making a threat is warned to delete the proof.

**A bully games it.** Someone can test messages against a server running Ward until it stops
flagging them, or dress abuse up as a report to avoid a nudge. Ward ignores a bare "someone said",
quotation marks, and "told me to tell you", and a dangerous message still reaches moderators
whichever way it is framed. `/ward server` tells moderators Ward can be gamed and that a person
decides, every time.

**Members don't know they are being read.** `/ward server` gives moderators a notice to pin for
members: what Ward reads, what goes to moderators, and that telling what happened won't get
anyone in trouble.

## Ward isn't enough

An app can't make bullying stop. Ward's job is to help a child see it clearly, keep proof, take
the safe next steps, and get an adult involved on their terms. Every path through the app ends
at a person: a trusted adult, a helpline, or a teacher with a printed report.
