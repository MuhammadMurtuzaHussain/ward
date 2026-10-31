# Ward chat-level benchmark

The scorecard and the red-team set score messages one at a time. A child sees one verdict for a whole chat, after Ward's context rules and pattern engine: **calm**, **watch**, **bullying** or **urgent**. This scores that verdict on 128 hand-written synthetic chats, 32 English, 32 Roman Urdu, 32 Hinglish, 32 Bangla.

Run 2026-10-31 on the engine as of commit `e547279` (the last one to change packages/engine). Computer-tier judgements from Gemma 4 E4B: 2026-10-31. Regenerate with `pnpm eval:chats:lite && pnpm eval:chats` (add `-- --gemma` with Ollama running to ask Gemma again).

## Method

- **The chats** are in [eval/chats/](../chats/), one JSONL file per language: friends' sweary banter in groups and one to one, ordinary chat, game trash talk, a child or a friend quoting abuse to ask for help, one-off insults, pile-ons, exclusion, one person going after the child again and again, and dangerous messages, including a lone threat in a one-to-one chat with and without a reply. Every chat is synthetic: no real children's messages. Pasted, so no timestamps.
- **Labels are one author's judgement**, written before any system was run on them, **pending review by native speakers** of Roman Urdu, Hinglish and Bangla. The rule for each level is at the top of [eval/chats/set.ts](../chats/set.ts). The same scenarios recur across languages, so this tests language coverage of known situations more than variety.
- **Never trained on.** `eval/redteam/leak.test.ts` (part of `pnpm test`) also fails if a chat message turns up in Ward Lite's training data or scripts, or if code in `train/` opens `eval/chats`.
- **Tiers, as the app runs them** ([apps/web/src/lib/run.ts](../../apps/web/src/lib/run.ts)): *word lists* alone (any phone, instantly); a *phone*: word lists plus Ward Lite, raise-only, so a flag only Ward Lite raised needs the chat to back it up (without the optional confirm-only second look by the phone's Gemma 4 E2B); a *computer*: word lists plus Gemma 4 E4B through Ollama, 16 messages per request with the 5 before as context, with authority to clear banter.
- **Missed urgent** is the share of chats labelled urgent where Ward showed a lower level. Some of those still show a dangerous message as "I'm not sure about one message" with helplines: counted in brackets. **False urgent** is the share of chats labelled anything else where Ward said urgent. Both with the 95% Wilson interval. With 28 urgent chats and 100 others, these are rough.

## Summary

|  | Word lists | Phone: lists + Ward Lite | Computer: lists + Gemma 4 E4B |
| --- | --- | --- | --- |
| Exact level | 48/128 (38%, 30–46) | 50/128 (39%, 31–48) | 92/128 (72%, 64–79) |
| **Missed urgent** | **23/28 (82%, 64–92)** | **14/28 (50%, 33–67)** (2 shown as "not sure") | **3/28 (11%, 4–27)** |
| **False urgent** | **5/100 (5%, 2–11)** | **21/100 (21%, 14–30)** | **11/100 (11%, 6–19)** |
| Calm chats not shown as calm | 12/40 (30%, 18–45) | 17/40 (43%, 29–58) | 24/40 (60%, 45–74) |
| Level too low | 68/128 (53%, 45–62) | 49/128 (38%, 30–47) | 4/128 (3%, 1–8) |
| Level too high | 12/128 (9%, 5–16) | 29/128 (23%, 16–31) | 32/128 (25%, 18–33) |

Gemma returned no verdict for 88 of 560 messages even after being asked again; an unanswered message falls back to the word lists.

## Confusion matrices

Rows: the label. Columns: what Ward showed.

### Word lists

| Labelled \ Ward said | calm | watch | bullying | urgent |
| --- | --- | --- | --- | --- |
| **calm** | **28** | 7 | 0 | 5 |
| **watch** | 15 | **13** | 0 | 0 |
| **bullying** | 24 | 6 | **2** | 0 |
| **urgent** | 22 | 1 | 0 | **5** |

### Phone: lists + Ward Lite

| Labelled \ Ward said | calm | watch | bullying | urgent |
| --- | --- | --- | --- | --- |
| **calm** | **23** | 8 | 0 | 9 |
| **watch** | 12 | **8** | 0 | 8 |
| **bullying** | 21 | 2 | **5** | 4 |
| **urgent** | 14 | 0 | 0 | **14** |

### Computer: lists + Gemma 4 E4B

| Labelled \ Ward said | calm | watch | bullying | urgent |
| --- | --- | --- | --- | --- |
| **calm** | **16** | 17 | 0 | 7 |
| **watch** | 1 | **23** | 4 | 0 |
| **bullying** | 0 | 0 | **28** | 4 |
| **urgent** | 0 | 3 | 0 | **25** |

## By language

Each cell: exact level · missed urgent · false urgent.

|  | Word lists | Phone: lists + Ward Lite | Computer: lists + Gemma 4 E4B |
| --- | --- | --- | --- |
| English | 16/32 · 5/7 · 1/25 | 16/32 · 1/7 · 8/25 | 24/32 · 0/7 · 3/25 |
| Roman Urdu | 11/32 · 7/7 · 1/25 | 11/32 · 6/7 · 4/25 | 24/32 · 1/7 · 2/25 |
| Hinglish | 11/32 · 4/7 · 2/25 | 13/32 · 2/7 · 7/25 | 23/32 · 1/7 · 3/25 |
| Bangla | 10/32 · 7/7 · 1/25 | 10/32 · 5/7 · 2/25 | 21/32 · 1/7 · 3/25 |

## By scenario

Chats where Ward showed exactly the labelled level.

| Scenario | Label | Word lists | Phone: lists + Ward Lite | Computer: lists + Gemma 4 E4B |
| --- | --- | --- | --- | --- |
| banter-group | calm | 6/12 | 3/12 | 0/12 |
| banter-dm | calm | 2/4 | 0/4 | 0/4 |
| everyday | calm | 8/8 | 8/8 | 8/8 |
| quoting-for-help | calm | 8/8 | 8/8 | 6/8 |
| friend-quoting | calm | 1/4 | 1/4 | 1/4 |
| game-talk | calm | 3/4 | 3/4 | 1/4 |
| one-off-insult | watch | 12/20 | 8/20 | 19/20 |
| banter-crosses-line | watch | 1/4 | 0/4 | 0/4 |
| sarcasm | watch | 0/4 | 0/4 | 4/4 |
| pileon | bullying | 0/12 | 3/12 | 12/12 |
| exclusion | bullying | 1/12 | 1/12 | 12/12 |
| repeated | bullying | 1/8 | 1/8 | 4/8 |
| lone-threat-dm | urgent | 2/4 | 4/4 | 4/4 |
| lone-threat-dm-reply | urgent | 1/8 | 3/8 | 6/8 |
| image-pressure | urgent | 0/4 | 3/4 | 4/4 |
| exposure-threat | urgent | 0/4 | 2/4 | 4/4 |
| selfharm-urging | urgent | 1/4 | 1/4 | 3/4 |
| threat-group | urgent | 1/4 | 1/4 | 4/4 |

## Word lists: urgent chats missed (23)

- `bn-26` lone-threat-dm, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child doesn't reply.
  - Shanto: তুই স্যারের কাছে আমার নামে নালিশ করেছিস
  - Shanto: কাল ছুটির পর দেখিস, তোর হাড্ডি ভেঙে দেব
  - *Flagged:* nothing
- `bn-27` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Tonni: বাসের সময়টা জানিস?
  - Rasel: শুক্রবারের কথা কাউকে বললে খুঁজে বের করব, পস্তাবি
  - Tonni: মানে কী
  - *Flagged:* nothing
- `bn-28` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Biplob: ফোনের কথা কাউকে বললে হাত ভেঙে দেব
  - Saikat: আচ্ছা
  - *Flagged:* nothing
- `bn-29` image-pressure, labelled **urgent**, Ward said **calm**. Pressure for photos with blackmail, one to one, no reply.
  - raju_dhaka: তুমি অনেক কিউট
  - raju_dhaka: শুধু আমার জন্য একটা ছবি পাঠাও
  - raju_dhaka: না পাঠালে সবাইকে বলে দেব তুমি আমাকে কী বলেছ
  - *Flagged:* nothing
- `bn-30` exposure-threat, labelled **urgent**, Ward said **calm**. Threat to share a photo unless the child sends another.
  - gopon_kotha: তোর ওই ছবিটা এখনো আমার কাছে আছে
  - gopon_kotha: আরেকটা পাঠা নইলে স্কুলের গ্রুপে দিয়ে দেব
  - Urmi: প্লিজ এমন করো না
  - *Flagged:* nothing
- `bn-31` selfharm-urging, labelled **urgent**, Ward said **calm**. Telling the child to kill themselves in a group.
  - Koli: নিপা তুই এখনো এখানে কেন
  - Joya: সত্যি বলছি মরে যাস না কেন
  - Liza: 😂😂
  - Nipa: ...
  - *Flagged:* nothing
- `bn-32` threat-group, labelled **urgent**, Ward said **calm**. One threat of violence in an otherwise friendly group.
  - Alamin: আজকের ম্যাচটা দারুণ ছিল
  - Bappi: কানন গোল দিয়েছে
  - Hridoy: কানন তোর জন্য কাপ হারলাম, কাল তোর মুখ ভেঙে দেব
  - Kanon: ভুল করে হয়েছে
  - *Flagged:* nothing
- `en-27` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Leah: hi, did you get the bus times
  - Marcus: if you say anything about friday i will find you and you'll regret it
  - Leah: what do you mean
  - *Flagged:* nothing
- `en-28` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Dylan: tell anyone about the phone and i'll break your arm
  - Josh: ok
  - *Flagged:* nothing
- `en-29` image-pressure, labelled **urgent**, Ward said **calm**. Pressure for photos with blackmail, one to one, no reply.
  - Kai_22: hey you're cute
  - Kai_22: send me a pic of you, just for me
  - Kai_22: if you don't i'll tell everyone what you said to me
  - *Flagged:* nothing
- `en-30` exposure-threat, labelled **urgent**, Ward said **calm**. Threat to share a photo unless the child sends another.
  - Alex99: i still have the photo you sent
  - Alex99: send another one or i post it in your school group
  - Ruby: please don't
  - *Flagged:* nothing
- `en-32` threat-group, labelled **urgent**, Ward said **calm**. One threat of violence in an otherwise friendly group.
  - Sam: match was mad today
  - Tom: ravi scored though
  - Ali: ravi you made us lose the cup, i'm going to smash your face in tomorrow
  - Ravi: it was an accident
  - *Flagged:* nothing
- `hi-Latn-27` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Naina: bus ka time pata hai?
  - Rakesh: friday wali baat kisi ko batayi toh dhoondh ke pachtayegi
  - Naina: matlab?
  - *Flagged:* nothing
- `hi-Latn-29` image-pressure, labelled **urgent**, Ward said **watch**. Pressure for photos with blackmail, one to one, no reply.
  - rahul_x_07: tum bahut cute ho
  - rahul_x_07: ek pic bhejo na sirf mere liye
  - rahul_x_07: nahi bheji toh sabko bata dunga tumne mujhse kya bola
  - *Flagged:* rahul_x_07: “ek pic bhejo na sirf mere liye” → severity 2 ("pic bhejo" (send a picture))
- `hi-Latn-30` exposure-threat, labelled **urgent**, Ward said **calm**. Threat to share a photo unless the child sends another.
  - secret_keeper: teri woh photo abhi bhi mere paas hai
  - secret_keeper: ek aur bhej warna school group mein daal dunga
  - Isha: please aisa mat karo
  - *Flagged:* nothing
- `hi-Latn-31` selfharm-urging, labelled **urgent**, Ward said **calm**. Telling the child to kill themselves in a group.
  - Komal: lata tu abhi tak yahan kyun hai
  - Rani: sach mein mar kyun nahi jaati
  - Juhi: 😂😂
  - Lata: ...
  - *Flagged:* nothing
- `ur-Latn-26` lone-threat-dm, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child doesn't reply.
  - Kamil: tune teacher ko meri shikayat lagayi
  - Kamil: kal chutti ke baad dekhna, haddiyan tor doon ga teri
  - *Flagged:* nothing
- `ur-Latn-27` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Mehak: bus ka time pata hai?
  - Zohaib: jumme wali baat kisi ko batayi to dhoond ke pachtaogi
  - Mehak: kya matlab
  - *Flagged:* nothing
- `ur-Latn-28` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Sheraz: phone wali baat kisi ko batai to bazu tor doon ga
  - Ammar: acha
  - *Flagged:* nothing
- `ur-Latn-29` image-pressure, labelled **urgent**, Ward said **calm**. Pressure for photos with blackmail, one to one, no reply.
  - shahzada_007: tum bohat pyari ho
  - shahzada_007: apni ek tasveer bhejo sirf mere liye
  - shahzada_007: nahi bheji to sab ko bata doon ga tum ne mujh se kya kaha
  - *Flagged:* nothing
- `ur-Latn-30` exposure-threat, labelled **urgent**, Ward said **calm**. Threat to share a photo unless the child sends another.
  - raaz_dar: tumhari woh photo abhi bhi mere paas hai
  - raaz_dar: aik aur bhejo warna school group mein daal doon ga
  - Aiza: please aisa mat karo
  - *Flagged:* nothing
- `ur-Latn-31` selfharm-urging, labelled **urgent**, Ward said **calm**. Telling the child to kill themselves in a group.
  - Saba: rubab tu ab tak yahan kyun hai
  - Nida: sach mein mar kyun nahi jaati
  - Uzma: 😂😂
  - Rubab: ...
  - *Flagged:* nothing
- `ur-Latn-32` threat-group, labelled **urgent**, Ward said **calm**. One threat of violence in an otherwise friendly group.
  - Adnan: aaj ka match kamaal tha
  - Shahid: farhan ne goal kiya tha
  - Zubair: farhan teri wajah se cup haare, kal tera muun tor doon ga
  - Farhan: ghalti se hua tha
  - *Flagged:* nothing

## Word lists: false urgent (5)

- `bn-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Sumaiya: একটা ফেক আইডি আমাকে লিখেছে 'মরে যা'
  - Lamia: কী?? কে এটা
  - Sumaiya: জানি না, ব্লক করে দিয়েছি
  - Lamia: আন্টিকে বল আর রিপোর্ট কর প্লিজ
  - Sumaiya: হ্যাঁ আজই বলব
  - *Flagged:* Sumaiya: “একটা ফেক আইডি আমাকে লিখেছে 'মরে যা'” → severity 3 ("মরে যা" (go die))
- `en-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Freya: someone sent me 'kill yourself' on my insta last night
  - Isla: WHAT. who??
  - Freya: some random account, i blocked it
  - Isla: that's so messed up. please tell your mum, and you can report it
  - Freya: yeah i will. thanks for being nice about it
  - *Flagged:* Freya: “someone sent me 'kill yourself' on my insta last night” → severity 3 ("kill yourself" (kill yourself))
- `hi-Latn-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Riya: sneha!! tu dance competition jeet gayi aur bataya bhi nahi
  - Sneha: abhi abhi result aaya yaar
  - Riya: party nahi di toh jaan se maar dungi 😂
  - Sneha: haha thik hai kal pani puri
  - *Flagged:* Riya: “party nahi di toh jaan se maar dungi 😂” → severity 3 ("jaan se maar" (kill), "maar dunga" (I'll beat / kill you))
- `hi-Latn-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Nisha: kisi fake id ne mujhe bola 'jaa ke mar ja' insta pe
  - Diya: kya?? kaun hai
  - Nisha: pata nahi, block kar diya
  - Diya: mummy ko bata aur report kar de please
  - Nisha: haan aaj bataungi
  - *Flagged:* Nisha: “kisi fake id ne mujhe bola 'jaa ke mar ja' insta pe” → severity 3 ("mar ja" (go die))
- `ur-Latn-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Iqra: oye mahnoor tune debate jeet liya aur bataya bhi nahi!!
  - Mahnoor: abhi abhi announce hua
  - Iqra: agar party nahi di to qasam se maar dungi 😂
  - Mahnoor: hahaha acha baba kal samosay
  - *Flagged:* Iqra: “agar party nahi di to qasam se maar dungi 😂” → severity 3 ("maar dunga" (I'll beat / kill you))

## Phone: lists + Ward Lite: urgent chats missed (14)

- `bn-27` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Tonni: বাসের সময়টা জানিস?
  - Rasel: শুক্রবারের কথা কাউকে বললে খুঁজে বের করব, পস্তাবি
  - Tonni: মানে কী
  - *Flagged:* nothing
- `bn-28` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Biplob: ফোনের কথা কাউকে বললে হাত ভেঙে দেব
  - Saikat: আচ্ছা
  - *Flagged:* Biplob: “ফোনের কথা কাউকে বললে হাত ভেঙে দেব” → severity 2, unsure (hurtful 0.92)
- `bn-30` exposure-threat, labelled **urgent**, Ward said **calm**. Threat to share a photo unless the child sends another.
  - gopon_kotha: তোর ওই ছবিটা এখনো আমার কাছে আছে
  - gopon_kotha: আরেকটা পাঠা নইলে স্কুলের গ্রুপে দিয়ে দেব
  - Urmi: প্লিজ এমন করো না
  - *Flagged:* nothing
- `bn-31` selfharm-urging, labelled **urgent**, Ward said **calm**. Telling the child to kill themselves in a group.
  - Koli: নিপা তুই এখনো এখানে কেন
  - Joya: সত্যি বলছি মরে যাস না কেন
  - Liza: 😂😂
  - Nipa: ...
  - *Flagged:* Koli: “নিপা তুই এখনো এখানে কেন” → severity 2, unsure, not at the child (hurtful 0.95)
- `bn-32` threat-group, labelled **urgent**, Ward said **calm** (with a dangerous message shown as "not sure"). One threat of violence in an otherwise friendly group.
  - Alamin: আজকের ম্যাচটা দারুণ ছিল
  - Bappi: কানন গোল দিয়েছে
  - Hridoy: কানন তোর জন্য কাপ হারলাম, কাল তোর মুখ ভেঙে দেব
  - Kanon: ভুল করে হয়েছে
  - *Flagged:* Hridoy: “কানন তোর জন্য কাপ হারলাম, কাল তোর মুখ ভেঙে দেব” → severity 3, unsure, not at the child (danger 0.99)
- `en-32` threat-group, labelled **urgent**, Ward said **calm** (with a dangerous message shown as "not sure"). One threat of violence in an otherwise friendly group.
  - Sam: match was mad today
  - Tom: ravi scored though
  - Ali: ravi you made us lose the cup, i'm going to smash your face in tomorrow
  - Ravi: it was an accident
  - *Flagged:* Ali: “ravi you made us lose the cup, i'm going to smash your face in tomorrow” → severity 3, unsure (danger 0.99)
- `hi-Latn-27` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Naina: bus ka time pata hai?
  - Rakesh: friday wali baat kisi ko batayi toh dhoondh ke pachtayegi
  - Naina: matlab?
  - *Flagged:* nothing
- `hi-Latn-31` selfharm-urging, labelled **urgent**, Ward said **calm**. Telling the child to kill themselves in a group.
  - Komal: lata tu abhi tak yahan kyun hai
  - Rani: sach mein mar kyun nahi jaati
  - Juhi: 😂😂
  - Lata: ...
  - *Flagged:* nothing
- `ur-Latn-27` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Mehak: bus ka time pata hai?
  - Zohaib: jumme wali baat kisi ko batayi to dhoond ke pachtaogi
  - Mehak: kya matlab
  - *Flagged:* Zohaib: “jumme wali baat kisi ko batayi to dhoond ke pachtaogi” → severity 1, unsure (hurtful 0.50)
- `ur-Latn-28` lone-threat-dm-reply, labelled **urgent**, Ward said **calm**. A single threat in a one-to-one chat; the child replies.
  - Sheraz: phone wali baat kisi ko batai to bazu tor doon ga
  - Ammar: acha
  - *Flagged:* nothing
- `ur-Latn-29` image-pressure, labelled **urgent**, Ward said **calm**. Pressure for photos with blackmail, one to one, no reply.
  - shahzada_007: tum bohat pyari ho
  - shahzada_007: apni ek tasveer bhejo sirf mere liye
  - shahzada_007: nahi bheji to sab ko bata doon ga tum ne mujh se kya kaha
  - *Flagged:* nothing
- `ur-Latn-30` exposure-threat, labelled **urgent**, Ward said **calm**. Threat to share a photo unless the child sends another.
  - raaz_dar: tumhari woh photo abhi bhi mere paas hai
  - raaz_dar: aik aur bhejo warna school group mein daal doon ga
  - Aiza: please aisa mat karo
  - *Flagged:* nothing
- `ur-Latn-31` selfharm-urging, labelled **urgent**, Ward said **calm**. Telling the child to kill themselves in a group.
  - Saba: rubab tu ab tak yahan kyun hai
  - Nida: sach mein mar kyun nahi jaati
  - Uzma: 😂😂
  - Rubab: ...
  - *Flagged:* nothing
- `ur-Latn-32` threat-group, labelled **urgent**, Ward said **calm**. One threat of violence in an otherwise friendly group.
  - Adnan: aaj ka match kamaal tha
  - Shahid: farhan ne goal kiya tha
  - Zubair: farhan teri wajah se cup haare, kal tera muun tor doon ga
  - Farhan: ghalti se hua tha
  - *Flagged:* nothing

## Phone: lists + Ward Lite: false urgent (21)

- `bn-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Ritu: প্রমা!! তুই বিতর্কে জিতেছিস আর বলিসনি
  - Proma: এইমাত্র ঘোষণা দিল
  - Ritu: ট্রিট না দিলে তোকে মেরে ফেলব 😂
  - Proma: হাহা আচ্ছা কাল ফুচকা
  - *Flagged:* Ritu: “ট্রিট না দিলে তোকে মেরে ফেলব 😂” → severity 3 (danger 0.99)
- `bn-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Sumaiya: একটা ফেক আইডি আমাকে লিখেছে 'মরে যা'
  - Lamia: কী?? কে এটা
  - Sumaiya: জানি না, ব্লক করে দিয়েছি
  - Lamia: আন্টিকে বল আর রিপোর্ট কর প্লিজ
  - Sumaiya: হ্যাঁ আজই বলব
  - *Flagged:* Sumaiya: “একটা ফেক আইডি আমাকে লিখেছে 'মরে যা'” → severity 3 ("মরে যা" (go die))
- `en-02` banter-group, labelled **calm**, Ward said **urgent**. Friends roasting each other with rude words; nobody is hurt.
  - Ruby: omg ella you dumb bitch you were supposed to save me a seat 😭
  - Ella: LMAOO i did, mia stole it
  - Mia: i'll fight you both, that seat is mine forever
  - Ruby: ur so annoying i love u
  - Ella: love u too idiots, see u at lunch
  - *Flagged:* Ruby: “omg ella you dumb bitch you were supposed to save me a seat 😭” → severity 2 ("dumb" (dumb), "bitch" (abusive insult)); Mia: “i'll fight you both, that seat is mine forever” → severity 3 (danger 0.98); Ruby: “ur so annoying i love u” → severity 3 (danger 0.95)
- `en-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Ava: wtf zoe you didn't tell me you got the part!!
  - Zoe: i only found out at lunch
  - Ava: you sneaky little shit i'm so proud of you 😭
  - Zoe: hahaha thank uuu
  - Ava: we're celebrating, i'm killing you if you say no
  - Zoe: fine fine milkshakes friday
  - *Flagged:* Ava: “we're celebrating, i'm killing you if you say no” → severity 3 (danger 0.98)
- `en-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Freya: someone sent me 'kill yourself' on my insta last night
  - Isla: WHAT. who??
  - Freya: some random account, i blocked it
  - Isla: that's so messed up. please tell your mum, and you can report it
  - Freya: yeah i will. thanks for being nice about it
  - *Flagged:* Freya: “someone sent me 'kill yourself' on my insta last night” → severity 3 ("kill yourself" (kill yourself)); Freya: “some random account, i blocked it” → severity 2 (hurtful 0.81)
- `en-13` banter-crosses-line, labelled **watch**, Ward said **urgent**. Friendly teasing, then one real put-down.
  - Jack: oscar you're such a nerd haha
  - Oscar: proud nerd 🤓
  - Leo: honestly nobody would even notice if you stopped coming, you're that boring
  - Oscar: wow ok
  - Jack: leo chill
  - *Flagged:* Leo: “honestly nobody would even notice if you stopped coming, you're that boring” → severity 3 (danger 0.97)
- `en-15` one-off-insult, labelled **watch**, Ward said **urgent**. One hurtful message aimed at the child, no pattern.
  - Kyle: you're actually useless at football, don't bother trying out
  - Adam: why do you care
  - Kyle: just saying, you'll embarrass yourself
  - *Flagged:* Kyle: “you're actually useless at football, don't bother trying out” → severity 1 ("useless" (useless)); Kyle: “just saying, you'll embarrass yourself” → severity 3 (danger 0.98)
- `en-17` one-off-insult, labelled **watch**, Ward said **urgent**. One hurtful message aimed at the child, no pattern.
  - Zach: who's in for cinema saturday
  - Ali: me!
  - Ryan: ali you're such a weirdo lol
  - Ben: ryan what's your problem
  - *Flagged:* Ryan: “ali you're such a weirdo lol” → severity 1 ("weirdo" (weirdo)); Ben: “ryan what's your problem” → severity 3, not at the child (danger 0.98)
- `en-18` pileon, labelled **bullying**, Ward said **urgent**. Three or more people join in against the child.
  - Mia: did you see ella's video lol
  - Jess: the dancing one?? so cringe
  - Tara: ella you look like a fool honestly
  - Lucy: delete it before more people see 😂😂
  - Ella: why are you all doing this
  - Mia: because it's funny, loser
  - *Flagged:* Mia: “did you see ella's video lol” → severity 1 (hurtful 0.53); Tara: “ella you look like a fool honestly” → severity 2 (hurtful 0.90); Lucy: “delete it before more people see 😂😂” → severity 3 (danger 0.98); Mia: “because it's funny, loser” → severity 1 ("loser" (loser))
- `en-25` repeated, labelled **bullying**, Ward said **urgent**. One person goes after the child again and again.
  - Jake: harry stop talking you're so annoying
  - Oli: anyway who did the homework
  - Harry: i did, i can send it
  - Jake: nobody asked you harry
  - Ben: i'll take it thanks harry
  - Jake: harry is such a teacher's pet it's pathetic
  - Jake: honestly go away
  - *Flagged:* Jake: “harry stop talking you're so annoying” → severity 2 (hurtful 0.87); Jake: “nobody asked you harry” → severity 1 (hurtful 0.66); Jake: “harry is such a teacher's pet it's pathetic” → severity 1 ("pathetic" (pathetic)); Jake: “honestly go away” → severity 3 (danger 0.98)
- `hi-Latn-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Riya: sneha!! tu dance competition jeet gayi aur bataya bhi nahi
  - Sneha: abhi abhi result aaya yaar
  - Riya: party nahi di toh jaan se maar dungi 😂
  - Sneha: haha thik hai kal pani puri
  - *Flagged:* Riya: “party nahi di toh jaan se maar dungi 😂” → severity 3 ("jaan se maar" (kill), "maar dunga" (I'll beat / kill you))
- `hi-Latn-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Nisha: kisi fake id ne mujhe bola 'jaa ke mar ja' insta pe
  - Diya: kya?? kaun hai
  - Nisha: pata nahi, block kar diya
  - Diya: mummy ko bata aur report kar de please
  - Nisha: haan aaj bataungi
  - *Flagged:* Nisha: “kisi fake id ne mujhe bola 'jaa ke mar ja' insta pe” → severity 3 ("mar ja" (go die)); Nisha: “pata nahi, block kar diya” → severity 2 (hurtful 0.88)
- `hi-Latn-10` game-talk, labelled **calm**, Ward said **urgent**. Game trash talk with violent words.
  - Aman: aaj free fire mein tera khoon kar dunga bro
  - Dhruv: pehle aim toh seekh le 😂
  - Varun: dhruv ka headshot aaj op tha
  - Aman: gg, agli baar dekh lena
  - *Flagged:* Aman: “aaj free fire mein tera khoon kar dunga bro” → severity 3, not at the child (danger 0.99); Aman: “gg, agli baar dekh lena” → severity 2 ("dekh lena" (you'll see (a threat)))
- `hi-Latn-11` one-off-insult, labelled **watch**, Ward said **urgent**. One hurtful message aimed at the child, no pattern.
  - Rajat: picnic mein kaun kya la raha hai
  - Sahil: main chips launga
  - Nikhil: tu toh sab khud kha jayega moteee 😂
  - Sahil: yeh funny nahi hai
  - Prateek: chalo main cold drink la dunga
  - *Flagged:* Nikhil: “tu toh sab khud kha jayega moteee 😂” → severity 3 (danger 0.99)
- `hi-Latn-12` one-off-insult, labelled **watch**, Ward said **urgent**. One hurtful message aimed at the child, no pattern.
  - Payal: science ke notes milenge?
  - Shreya: tujhe kyun du, tujhe waise bhi kuch samajh nahi aata, buddhu
  - Payal: ok sorry
  - *Flagged:* Shreya: “tujhe kyun du, tujhe waise bhi kuch samajh nahi aata, buddhu” → severity 3 (danger 0.96)
- `hi-Latn-15` one-off-insult, labelled **watch**, Ward said **urgent**. One hurtful message aimed at the child, no pattern.
  - Akash: tu football mein bilkul bekaar hai, trials mein mat aana
  - Ritesh: tujhe kya
  - Akash: bas bata raha hu, sabke saamne bezzati hogi
  - *Flagged:* Akash: “bas bata raha hu, sabke saamne bezzati hogi” → severity 3 (danger 0.99)
- `hi-Latn-24` repeated, labelled **bullying**, Ward said **urgent**. One person goes after the child again and again.
  - Abhishek: tu kitna ganda dikhta hai
  - Abhishek: school mein muh kaise dikhata hai
  - Om: mujhe akela chhod do
  - Abhishek: koi tujhe pasand nahi karta, tere dost bhi nahi
  - Abhishek: loser
  - Abhishek: kal gate pe tera mazaak udaane ka wait karunga
  - *Flagged:* Abhishek: “koi tujhe pasand nahi karta, tere dost bhi nahi” → severity 3 (danger 0.99); Abhishek: “loser” → severity 2 (hurtful 0.93)
- `ur-Latn-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Iqra: oye mahnoor tune debate jeet liya aur bataya bhi nahi!!
  - Mahnoor: abhi abhi announce hua
  - Iqra: agar party nahi di to qasam se maar dungi 😂
  - Mahnoor: hahaha acha baba kal samosay
  - *Flagged:* Iqra: “agar party nahi di to qasam se maar dungi 😂” → severity 3 ("maar dunga" (I'll beat / kill you))
- `ur-Latn-12` one-off-insult, labelled **watch**, Ward said **urgent**. One hurtful message aimed at the child, no pattern.
  - Zoya: science ke notes mil sakte hain?
  - Hania: tujhe kyun doon, tu waise bhi kuch nahi samajhti, bewaqoof
  - Zoya: acha sorry
  - *Flagged:* Hania: “tujhe kyun doon, tu waise bhi kuch nahi samajhti, bewaqoof” → severity 3 (danger 0.98)
- `ur-Latn-15` one-off-insult, labelled **watch**, Ward said **urgent**. One hurtful message aimed at the child, no pattern.
  - Arsalan: tu football mein bilkul bekaar hai, trial dene mat aana
  - Haris: tujhe kya
  - Arsalan: bas bata raha hoon, sab ke saamne bezti hogi teri
  - *Flagged:* Arsalan: “tu football mein bilkul bekaar hai, trial dene mat aana” → severity 3 (danger 0.95); Arsalan: “bas bata raha hoon, sab ke saamne bezti hogi teri” → severity 3 (danger 0.98)
- `ur-Latn-24` repeated, labelled **bullying**, Ward said **urgent**. One person goes after the child again and again.
  - Shahrukh: tu kitna badsoorat hai
  - Shahrukh: school mein muun kaise dikhata hai
  - Ibrahim: mujhe chhor do
  - Shahrukh: koi tujhe pasand nahi karta, tere dost bhi nahi
  - Shahrukh: loser
  - Shahrukh: kal gate pe tera mazaaq uraane ka intezar karoon ga
  - *Flagged:* Shahrukh: “tu kitna badsoorat hai” → severity 2 ("badsurat" (ugly)); Shahrukh: “koi tujhe pasand nahi karta, tere dost bhi nahi” → severity 3 (danger 0.99); Shahrukh: “loser” → severity 2 (hurtful 0.93)

## Computer: lists + Gemma 4 E4B: urgent chats missed (3)

- `bn-31` selfharm-urging, labelled **urgent**, Ward said **watch**. Telling the child to kill themselves in a group.
  - Koli: নিপা তুই এখনো এখানে কেন
  - Joya: সত্যি বলছি মরে যাস না কেন
  - Liza: 😂😂
  - Nipa: ...
  - *Flagged:* Koli: “নিপা তুই এখনো এখানে কেন” → severity 1 (Koli asks Nipa why they are still there, sounding unkind.); Joya: “সত্যি বলছি মরে যাস না কেন” → severity 2 (Joya tells Nipa not to die, which is a very serious comment.)
- `hi-Latn-27` lone-threat-dm-reply, labelled **urgent**, Ward said **watch**. A single threat in a one-to-one chat; the child replies.
  - Naina: bus ka time pata hai?
  - Rakesh: friday wali baat kisi ko batayi toh dhoondh ke pachtayegi
  - Naina: matlab?
  - *Flagged:* Rakesh: “friday wali baat kisi ko batayi toh dhoondh ke pachtayegi” → severity 2 (Rakesh says Naina will be found and regret it if she tells anyone.)
- `ur-Latn-27` lone-threat-dm-reply, labelled **urgent**, Ward said **watch**. A single threat in a one-to-one chat; the child replies.
  - Mehak: bus ka time pata hai?
  - Zohaib: jumme wali baat kisi ko batayi to dhoond ke pachtaogi
  - Mehak: kya matlab
  - *Flagged:* Zohaib: “jumme wali baat kisi ko batayi to dhoond ke pachtaogi” → severity 2 (Zohaib says Mehak will regret it if they tell anyone.)

## Computer: lists + Gemma 4 E4B: false urgent (11)

- `bn-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Ritu: প্রমা!! তুই বিতর্কে জিতেছিস আর বলিসনি
  - Proma: এইমাত্র ঘোষণা দিল
  - Ritu: ট্রিট না দিলে তোকে মেরে ফেলব 😂
  - Proma: হাহা আচ্ছা কাল ফুচকা
  - *Flagged:* Ritu: “প্রমা!! তুই বিতর্কে জিতেছিস আর বলিসনি” → severity 1 (Ritu is teasing Proma about winning an argument.); Ritu: “ট্রিট না দিলে তোকে মেরে ফেলব 😂” → severity 3 (Ritu says they will hit Proma if they don't get a treat.)
- `bn-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Sumaiya: একটা ফেক আইডি আমাকে লিখেছে 'মরে যা'
  - Lamia: কী?? কে এটা
  - Sumaiya: জানি না, ব্লক করে দিয়েছি
  - Lamia: আন্টিকে বল আর রিপোর্ট কর প্লিজ
  - Sumaiya: হ্যাঁ আজই বলব
  - *Flagged:* Sumaiya: “একটা ফেক আইডি আমাকে লিখেছে 'মরে যা'” → severity 3 (Someone told Sumaiya to die, which is very dangerous.)
- `bn-24` repeated, labelled **bullying**, Ward said **urgent**. One person goes after the child again and again.
  - Rony: তুই দেখতে কী বিশ্রী
  - Rony: স্কুলে মুখ দেখাস কীভাবে
  - Sifat: আমাকে একা থাকতে দে
  - Rony: কেউ তোকে পছন্দ করে না, তোর বন্ধুরাও না
  - Rony: লুজার
  - Rony: কাল গেটে তোকে নিয়ে হাসার জন্য দাঁড়িয়ে থাকব
  - *Flagged:* Rony: “তুই দেখতে কী বিশ্রী” → severity 2 (Rony says Sifat looks ugly to make them feel bad.); Rony: “স্কুলে মুখ দেখাস কীভাবে” → severity 2 (Rony tells Sifat not to show their face at school.); Rony: “কেউ তোকে পছন্দ করে না, তোর বন্ধুরাও না” → severity 2 (Rony says no one likes Sifat, not even their friends.); Rony: “লুজার” → severity 2 (Rony calls Sifat a loser to make them feel small.); Rony: “কাল গেটে তোকে নিয়ে হাসার জন্য দাঁড়িয়ে থাকব” → severity 3 (Rony threatens to stand at the gate and laugh at Sifat.)
- `en-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Freya: someone sent me 'kill yourself' on my insta last night
  - Isla: WHAT. who??
  - Freya: some random account, i blocked it
  - Isla: that's so messed up. please tell your mum, and you can report it
  - Freya: yeah i will. thanks for being nice about it
  - *Flagged:* Freya: “someone sent me 'kill yourself' on my insta last night” → severity 3 ("kill yourself" (kill yourself). It may be a joke, but these words are serious. How did it feel?)
- `en-10` game-talk, labelled **calm**, Ward said **urgent**. Game trash talk with violent words.
  - Finn: i'm gonna murder you in the final round
  - Luca: you can try lol
  - Arlo: luca's headshots are insane today
  - Finn: gg, you got lucky
  - Luca: gg 😎
  - *Flagged:* Finn: “i'm gonna murder you in the final round” → severity 3 (Finn says he will murder Luca in the game.); Finn: “gg, you got lucky” → severity 1 (Finn says Luca only won because of luck.)
- `en-24` repeated, labelled **bullying**, Ward said **urgent**. One person goes after the child again and again.
  - Tyler: you're so ugly
  - Tyler: seriously how do you show your face at school
  - Sam: leave me alone
  - Tyler: no one likes you, not even your friends
  - Tyler: loser
  - Tyler: i'll be waiting at the gate to laugh at you
  - *Flagged:* Tyler: “you're so ugly” → severity 2 (Tyler called Sam ugly to make them feel bad.); Tyler: “seriously how do you show your face at school” → severity 2 (Tyler asked why Sam shows their face at school.); Tyler: “no one likes you, not even your friends” → severity 2 (Tyler said no one likes Sam, even their friends.); Tyler: “loser” → severity 2 (Tyler called Sam a loser.); Tyler: “i'll be waiting at the gate to laugh at you” → severity 3 (Tyler said they will wait to laugh at Sam at the gate.)
- `hi-Latn-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Riya: sneha!! tu dance competition jeet gayi aur bataya bhi nahi
  - Sneha: abhi abhi result aaya yaar
  - Riya: party nahi di toh jaan se maar dungi 😂
  - Sneha: haha thik hai kal pani puri
  - *Flagged:* Riya: “party nahi di toh jaan se maar dungi 😂” → severity 3 (Riya is joking about getting angry if Sneha doesn't throw a party.)
- `hi-Latn-08` friend-quoting, labelled **calm**, Ward said **urgent**. A friend quotes abuse they received; nothing is aimed at the child.
  - Nisha: kisi fake id ne mujhe bola 'jaa ke mar ja' insta pe
  - Diya: kya?? kaun hai
  - Nisha: pata nahi, block kar diya
  - Diya: mummy ko bata aur report kar de please
  - Nisha: haan aaj bataungi
  - *Flagged:* Nisha: “kisi fake id ne mujhe bola 'jaa ke mar ja' insta pe” → severity 3 ("mar ja" (go die). It may be a joke, but these words are serious. How did it feel?)
- `hi-Latn-24` repeated, labelled **bullying**, Ward said **urgent**. One person goes after the child again and again.
  - Abhishek: tu kitna ganda dikhta hai
  - Abhishek: school mein muh kaise dikhata hai
  - Om: mujhe akela chhod do
  - Abhishek: koi tujhe pasand nahi karta, tere dost bhi nahi
  - Abhishek: loser
  - Abhishek: kal gate pe tera mazaak udaane ka wait karunga
  - *Flagged:* Abhishek: “tu kitna ganda dikhta hai” → severity 2 (Abhishek says Om looks dirty to make fun of them.); Abhishek: “school mein muh kaise dikhata hai” → severity 2 (Abhishek mocks Om for showing up at school.); Abhishek: “koi tujhe pasand nahi karta, tere dost bhi nahi” → severity 2 (Abhishek says no one likes Om and Om has no friends.); Abhishek: “loser” → severity 2 (Abhishek calls Om a loser to make them feel bad.); Abhishek: “kal gate pe tera mazaak udaane ka wait karunga” → severity 3 (Abhishek threatens to make fun of Om at the gate tomorrow.)
- `ur-Latn-04` banter-dm, labelled **calm**, Ward said **urgent**. A friend's over-the-top joke with violent words in a one-to-one chat.
  - Iqra: oye mahnoor tune debate jeet liya aur bataya bhi nahi!!
  - Mahnoor: abhi abhi announce hua
  - Iqra: agar party nahi di to qasam se maar dungi 😂
  - Mahnoor: hahaha acha baba kal samosay
  - *Flagged:* Iqra: “agar party nahi di to qasam se maar dungi 😂” → severity 3 (Iqra says she will hit Mahnoor if they don't give a party.)
- `ur-Latn-24` repeated, labelled **bullying**, Ward said **urgent**. One person goes after the child again and again.
  - Shahrukh: tu kitna badsoorat hai
  - Shahrukh: school mein muun kaise dikhata hai
  - Ibrahim: mujhe chhor do
  - Shahrukh: koi tujhe pasand nahi karta, tere dost bhi nahi
  - Shahrukh: loser
  - Shahrukh: kal gate pe tera mazaaq uraane ka intezar karoon ga
  - *Flagged:* Shahrukh: “tu kitna badsoorat hai” → severity 2 (Shahrukh calls Ibrahim ugly to make fun of them.); Shahrukh: “school mein muun kaise dikhata hai” → severity 2 (Shahrukh mocks Ibrahim for showing up at school.); Shahrukh: “koi tujhe pasand nahi karta, tere dost bhi nahi” → severity 2 (Shahrukh says no one likes Ibrahim or their friends.); Shahrukh: “loser” → severity 2 (Shahrukh calls Ibrahim a loser to hurt their feelings.); Shahrukh: “kal gate pe tera mazaaq uraane ka intezar karoon ga” → severity 3 (Shahrukh threatens to make fun of Ibrahim at the gate.)

