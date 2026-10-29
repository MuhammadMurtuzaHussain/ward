# From MVP to something children can rely on

Ward doesn't solve cyberbullying. What exists today is a working tool for the child and a
measured technical approach. This document is about the distance between that and an
intervention that helps children at scale, through their growing years, by 2030, which is what
World Solve problem [WS05937](https://www.worldsolve.org/index.php?view=problem&id=5937) asks for.

## Where Ward stands against the problem

| WS05937 asks for | Today | The honest gap |
| --- | --- | --- |
| Works where resources are scarcest | Offline, free, no account; Roman Urdu, Hinglish and Bangla | Built for a child with their own phone. In Pakistan 50% of people aged 10+ own a phone (69% of men, 31% of women), and many children use a shared family phone. Pairing with a family computer doesn't fit most homes we're aiming at. |
| Clear, measurable results | A scorecard of how well the *classifier* reads abuse | Nothing yet measures outcomes for *children*: less bullying, more telling, faster help. |
| Identifies possible harms | [HARMS.md](HARMS.md) | Not reviewed by a child-protection professional. No safeguarding policy yet. |
| Respects local agency | The child owns everything; communities can edit slang packs | No children, parents or teachers have shaped it yet. |
| Maintainable and expandable by communities | Plain-JSON slang packs and lessons, MIT licence | No process for who adds words, who reviews them, or how a new language gets in. |

## What the evidence says

- School programs reduce cyberbullying, but modestly: across 50 studies and 45,371 young people,
  perpetration fell by g = -0.18 and victimisation by g = -0.13 (Polanin et al., 2022).
- Whole-school approaches do best. Anti-bullying programs average 17 to 23% reductions in
  bullying others and 17 to 20% in being bullied (Ttofi and Farrington, 2011, as summarised in
  the KiVa literature). Peers and teachers matter as much as the child being targeted.
- Bystander programs work better with an empathy component.
- App-only interventions for adolescents exposed to cyberbullying are being trialled (NettOpp in
  Norway, 709 participants) but the evidence is thin, and engagement data is mostly missing.
- Helplines exist and are stretched. Digital Rights Foundation's helpline took 3,012 new
  complaints in 2025; cases involving minors rose 28%; only 51% of cases came from cities with
  a cybercrime office.

**So Ward should not try to be the intervention.** It should be the child's front door into
the people and systems that already work, and make each of them work better.

## Three rings

1. **The child.** Spot it, save it, act on it, practise. *(Built.)*
2. **The child's circle.** The adult they tell, and the friends who see it happen.
3. **The community.** Schools, helplines, platforms.

### Built this week, one piece per ring

| Ring | Piece | Why |
| --- | --- | --- |
| Child | **Share to Ward** from WhatsApp's Export chat (Android share target) | Nobody saves a file and finds it again in the worst moment. Two taps from the chat to Ward. |
| Circle | **A guide for the adult they told**, in English and Urdu | Children stop telling when telling costs them. The guide says what to do in the first minutes, what not to do (take the phone, confront the family), and the next steps. |
| Circle | **Class mode** for teachers | The same lessons a child plays alone, projected for a room, with ground rules and a talking prompt per question. Nothing recorded. |
| Community | **A helpline-ready report** ([REPORT.md](REPORT.md)) | Who, what, when, how bad, what the child wants, and a digest a helpline can check. Saves intake time on every case. |

## What's still missing, in order

1. **Shared phones.** Separate profiles behind separate PINs, no message text in any preview, a
   quick-exit button. This is the normal case in the communities we're aiming at, not an edge case.
2. **Real reading on a cheap phone.** Gemma 3 1B failed our test (it cleared real insults as
   harmless). The plan: use Gemma 4 as a teacher to label a large set of messages, have
   children and teachers review a sample, and fine-tune a small student model (around 100 MB,
   runs in the app) with Tinker. Ship it only if it beats the slang packs on the scorecard *and*
   never lowers a dangerous message.
3. **Urdu script and read-aloud** for younger children and lower literacy, then Sindhi, Pashto,
   Punjabi, Hindi. Voice notes later; they're common in Pakistani chats.
4. **Safeguarding.** A child-protection professional reviews every crisis path; a written
   safeguarding policy; ethics approval before any pilot; a youth advisory group of 14 to 17
   year olds who review lessons and wording.
5. **Community upkeep.** One maintainer per language for slang packs, two-person review on every
   word added, a published list of what each word means and why it's there.
6. **Growing up with it.** The path from 8 to 17 ends with the child helping others: older teens
   become peer mentors and slang-pack reviewers.

## Measurement plan

The question isn't "is the classifier accurate" but "are children better off".

### Stage 1: feasibility pilot (3 to 5 schools, one city, one school term)

A pilot this size can't detect an effect of g = 0.15; it isn't meant to. It answers whether the
thing is used, safe, and worth a proper trial.

| Question | Measure | Go if |
| --- | --- | --- |
| Do teachers run it? | Class-mode lessons taught per class, from the teacher's own log | 4+ lessons per class per term |
| Do children use it? | Anonymous end-of-term survey: "Did you use Ward? Which parts?" | 30%+ of students used it at least once |
| Does it get children to tell someone? | Survey: "The last time something mean happened online, did you tell an adult?" before and after | Rises from baseline |
| Is it safe? | Every report of distress, misuse (e.g. a parent using it to read chats) or a wrong "looks okay", logged by the school counsellor | No serious harm; every case reviewed within a week |
| Do helplines find the report useful? | Caseworker rating of 20+ Ward reports against their usual intake | Faster or more complete intake |

### Stage 2: controlled trial (2027 to 2028)

Cluster-randomised by school, comparing schools with Ward (child app plus class mode plus adult
guide) to schools on the waiting list. Primary outcomes: cyber-victimisation and
cyber-perpetration on a validated scale such as the European Cyberbullying Intervention Project
Questionnaire (ECIPQ), at baseline, 3 and 9 months. Secondary: help-seeking, wellbeing, bystander
intervention. Sample size from a power calculation with an expected effect near the
meta-analytic g = 0.13 to 0.18; that means thousands of students across dozens of schools, which
is why stage 1 has to earn it.

### How we measure without breaking the promise

Nothing is collected from a child's phone. Outcomes come from anonymous school surveys run by the
school, the teacher's own log of lessons taught, and helpline caseworkers' ratings of reports
they received. If the app ever counts anything (lessons finished, checks run), it stays on the
device and is only shared if the child chooses to show it.

## Staged path to 2030

| When | What | Done when |
| --- | --- | --- |
| Now to 3 months | Shared-phone mode, Urdu script, distilled phone model, safeguarding review, report co-designed with one helpline | A helpline and one school agree to pilot |
| 3 to 12 months | Stage 1 pilot in one city; publish results, good or bad | Go/no-go on the table above |
| Year 2 to 3 | Stage 2 trial; second country through a partner (a child helpline or education NGO) | Published trial results |
| To 2030 | Free public good adopted through school systems and child helplines; languages added by maintainers; Ward report accepted by helplines and platforms as an intake format | Used in schools in 3+ countries, maintained by people who aren't us |

## Staying alive

- **Open and public.** MIT licence. Apply to the Digital Public Goods Alliance registry: its
  standard expects safeguards for underage users, which is what Ward is built around.
- **Funded like public infrastructure, not a startup.** Grants and partners, not a subscription
  a family has to pay or an ad model that needs children's attention.
- **Owned by the people who use it.** Language maintainers, a youth advisory group, partner
  helplines and schools with a real say in what's built next.

## Sources

- WHO/Europe HBSC: one in six school-aged children cyberbullied (2024).
- Polanin et al., *A systematic review and meta-analysis of interventions to decrease cyberbullying perpetration and victimization*, Prevention Science (2022).
- Ttofi and Farrington (2011), via the KiVa program literature.
- NettOpp trial protocol, JMIR Research Protocols (2021).
- Digital Rights Foundation, Cyber Harassment Helpline Report 2025 (April 2026).
- Pakistan Bureau of Statistics HIES 2024-25, as reported by PTA.
- Digital Public Goods Alliance, DPG Standard.
