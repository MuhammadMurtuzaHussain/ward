// Sample chats for the hosted demo, so a visitor can see a verdict in one tap. All synthetic,
// trimmed from the engine's test fixtures (packages/engine/fixtures) to the mildest wording that
// still shows each pattern: no self-harm lines, no slurs.

export type SampleId = "banter" | "pileon" | "dm";

export const SAMPLES: { id: SampleId; title: string; self: string; text: string }[] = [
  {
    id: "banter",
    title: "Omar and Saad",
    self: "Saad",
    text: `[03/11/2026, 16:20:11] Omar: bhai tu pagal hai kya 😂
[03/11/2026, 16:20:30] Saad: haan pagal hi hoon, chal match dekhte hain
[03/11/2026, 16:21:02] Omar: ullu, 7 baje start hai
[03/11/2026, 16:21:40] Saad: ok ok gadhe, aa jaunga
[03/11/2026, 16:22:00] Omar: pizza le aana`,
  },
  {
    id: "pileon",
    title: "8B Science",
    self: "Ayesha",
    text: `12/10/2026, 19:02 - Hamza created group "8B Science"
12/10/2026, 19:05 - Hamza: kal ka test kis chapter se hai?
12/10/2026, 19:06 - Ayesha: chapter 4 aur 5
12/10/2026, 19:06 - Zara: thanks ayesha
12/10/2026, 22:41 - Hamza: lol ayesha ki photo dekhi aaj ki?
12/10/2026, 22:42 - Bilal: haan moti lag rahi thi bilkul bhains 😂😂
12/10/2026, 22:42 - Ayesha: please aisa mat bolo
12/10/2026, 22:43 - Hamza: rone wali aa gayi
12/10/2026, 22:44 - Usman: ayesha teri shakal dekh ke hi pata chal jata hai
12/10/2026, 23:15 - Hamza added Shadow_786
12/10/2026, 23:15 - Hamza added xx.ghost.xx
12/10/2026, 23:16 - Shadow_786: ayesha tujhe koi pasand nahi karta
12/10/2026, 23:16 - xx.ghost.xx: haan isko group se nikalo yaar
12/10/2026, 23:17 - Shadow_786: moti bhains 🐃
13/10/2026, 07:30 - Zara: guys stop, ye theek nahi hai
14/10/2026, 22:05 - Bilal: ayesha nikammi`,
  },
  {
    id: "dm",
    title: "Jordan",
    self: "Sam",
    text: `5/2/26, 8:12 PM - Jordan: why did you even come to the party
5/2/26, 8:13 PM - Sam: I was invited?
5/2/26, 8:14 PM - Jordan: nobody wants you there. youre such a l00ser
5/3/26, 11:48 PM - Jordan: everyone saw your dance lmao. pathetic
5/3/26, 11:50 PM - Jordan: i have the video. send me $20 or everyone will see
5/4/26, 7:05 AM - Sam: please delete it`,
  },
];
