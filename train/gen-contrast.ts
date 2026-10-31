// Contrast pairs for Ward Lite: hand-written templates where the SAME time and meeting words
// ("tomorrow", "later", "after school", "at the gate", "kal", "school ke baad", "কাল") appear in
// friendly plans and in real threats, so the words alone can't decide "danger"; only the intent
// (break your teeth, post your photos, kill yourself) can. Most threats carry no time words at
// all. Deterministic: the same file every run.
//   node --experimental-strip-types gen-contrast.ts      -> data/contrast.jsonl
import { writeFileSync } from "node:fs";

type Lang = "en" | "ur-Latn" | "hi-Latn" | "bn";
interface Kit {
  times: string[];
  places: string[];
  foods: string[];
  things: string[];
  names: string[];
  /** Friendly messages; {t} time, {p} place, {f} food, {x} thing, {n} name. */
  kind: string[];
  /** Real threats: violence, self-harm urging, sexual pressure, exposure. {n} name. */
  harm: string[];
  /** How a threat can start with a time or meeting phrase (the contrast with `kind`). */
  lead: string[];
  ends: string[];
}

const SA = ["ali", "sara", "ayesha", "hamza", "zain", "fatima", "bilal", "hira", "rahul", "priya", "arjun", "neha", "riya", "kabir", "tanvir", "nusrat", "rafi", "mitu", "sabbir", "jake", "emma", "omar", "lily", "noah"];

const KITS: Record<Lang | "bn-Latn", Kit> = {
  en: {
    times: ["tomorrow", "tmrw", "tmr", "later", "after school", "after practice", "tonight", "at 5", "in the morning", "on monday", "after tuition", "at break", "after lunch", "this weekend"],
    places: ["the gate", "the bus stop", "the canteen", "the library", "the park", "the main gate", "the tuition centre", "the mall", "the ground", "my nani's house"],
    foods: ["samosa", "chips", "biryani", "ice cream", "pizza", "juice", "chocolate", "fries"],
    things: ["notebook", "charger", "calculator", "football", "bat", "lunchbox", "jacket", "maths copy", "headphones"],
    names: SA,
    kind: [
      "see you {t}", "see u {t}", "cya {t}", "ok see you {t}", "bye!! see you {t}", "meet at {p} {t}", "wait for me at {p} {t}, i'm coming",
      "i'll come over {t}", "come over {t}, mom made {f}", "i'll bring your {x} {t}", "don't forget your {x} {t}", "we have football practice {t}",
      "can you call me {t} about the science homework", "i'll get you a {f} {t}", "save me a seat {t}", "my dad is picking us up {t}", "text me {t}",
      "talk {t}", "good night, see you {t}", "{t} then 👍", "ok {t}", "see you {t} at {p}", "i'll wait for you at {p}", "we're coming for you at 6, the match starts at 7",
      "i'll find you at break, i have your {x}", "come to my house {t}, we'll play minecraft", "see you {t} {n}!", "{n} i'll see you {t}", "miss you already, see you {t}",
      "love you, see you {t}", "{n} are you coming {t}?", "meet me at {p} {t}, we're going to buy {f}", "don't tell anyone, it's a surprise party for {n} {t}",
    ],
    harm: [
      "i'm going to break your teeth", "you're gonna get beaten so bad", "i'll smash your face in", "my brothers will beat you up", "nobody will save you from me",
      "i'll make you bleed", "you'll end up in hospital", "i'll kill you", "go kill yourself", "go die, nobody wants you", "send me your pics or i post your chats everywhere",
      "pay me or everyone sees your photos", "i'll leak your pictures to the whole school", "i'll stab you", "we will jump you and break your legs", "i'll burn your house down",
      "do everyone a favour and end it", "send a pic in your underwear or else", "i'll hurt you so bad you won't come to school again", "i'll put your address in every group",
    ],
    lead: ["{t}", "see you {t},", "meet at {p} {t},", "wait for me at {p},", "{n},"],
    ends: ["", "", "!", ".", " bro", " lol", " 😂", " fr"],
  },
  "ur-Latn": {
    times: ["kal", "parson", "baad mein", "school ke baad", "chutti ke baad", "shaam ko", "raat ko", "subah", "tuition ke baad", "5 bajay", "break mein", "namaz ke baad", "Sunday ko"],
    places: ["gate", "bus stop", "canteen", "ground", "park", "masjid", "academy", "nani ke ghar", "tuition"],
    foods: ["samosay", "biryani", "chips", "pakoray", "ice cream", "chai", "juice", "fries"],
    things: ["copy", "charger", "bat", "calculator", "kitab", "register", "headphones"],
    names: SA,
    kind: [
      "kal milte hain", "{t} milte hain", "acha {t} milte hain", "{t} baat karte hain", "{p} pe milna {t}", "{t} {p} pe wait karna, main aa rahi hun",
      "mera wait karna {p} pe", "main {t} tumhare ghar aaunga", "{t} ghar aa jao, ammi ne {f} banaye hain", "{t} apni {x} le aana", "tumhare liye {f} le aaun?",
      "{t} match hai, aa jana", "{t} call karna homework ke liye", "chalo bye, {t} milte hain", "Allah hafiz, {t} milenge", "khuda hafiz {t} school mein milte hain",
      "seat rakh lena mere liye {t}", "abbu {t} hum dono ko le jayenge", "{n} {t} aa rahe ho na?", "main tumhe {p} pe dhoond lunga, tumhari {x} mere paas hai",
      "kisi ko batana mat, {t} {n} ki surprise party hai", "love you yaar, {t} milte hain", "{n} {t} mere ghar aao, minecraft khelenge",
    ],
    harm: [
      "tera daant tod dunga", "teri haddiyan tod dunga", "tujhe itna maarunga ke hospital jayega", "mere bhai tujhe maarenge", "tujhe koi nahi bachayega",
      "tujhe jaan se maar dunga", "khud ko maar le, kisi ko teri zaroorat nahi", "mar ja tu", "teri pics sab ko bhej dunga", "paise de warna teri chats viral kar dunga",
      "apni pics bhejo warna sab ko bata dunga", "tera mun tod dunga", "chaku maar dunga tujhe", "tera ghar jala dunga", "teri tasveerein poore school mein phela dunga",
      "itna maarenge ke school aana chor dega", "tera address har group mein daal dunga",
    ],
    lead: ["{t}", "{t} milte hain,", "{p} pe milna {t},", "{t} dekhna,", "{n},"],
    ends: ["", "", "!", ".", " yaar", " 😂", " samjha"],
  },
  "hi-Latn": {
    times: ["kal", "parso", "baad mein", "school ke baad", "chutti ke baad", "shaam ko", "raat ko", "subah", "tuition ke baad", "5 baje", "break mein", "practice ke baad", "Sunday ko"],
    places: ["gate", "bus stop", "canteen", "ground", "park", "mandir", "coaching", "nani ke ghar", "society gate"],
    foods: ["samose", "maggi", "chips", "pakode", "ice cream", "chai", "pani puri", "momos"],
    things: ["notebook", "charger", "bat", "calculator", "kitaab", "register", "headphones"],
    names: SA,
    kind: [
      "kal milte hai", "{t} milte hai", "chal bye, {t} milenge", "{t} baat karte hai", "{p} pe milna {t}", "{p} pe wait karna mera, {t} aa raha hu",
      "main {t} tere ghar aata hu", "{t} ghar aaja, mummy ne {f} banaye hai", "{t} meri {x} le aana yaar", "tere liye {f} lau?", "{t} match hai, aa jaana",
      "{t} call karna, homework samajhna hai", "good night, {t} milte hai", "{t} coaching ke liye wait karna", "mere liye seat rakhna {t}", "papa {t} hum dono ko drop karenge",
      "{n} {t} aa rahi hai na?", "{t} {p} pe milte hai, {f} khayenge", "main tujhe {p} pe dhoond lunga, teri {x} mere paas hai", "kisi ko mat batana, {t} {n} ki surprise party hai",
      "love you bhai, {t} milte hai", "{n} {t} mere ghar aa, minecraft khelenge",
    ],
    harm: [
      "tere daant tod dunga", "teri haddi tod dunga", "itna maarunga ki hospital jayega", "mere bhai tujhe peetenge", "tujhe koi nahi bachayega", "jaan se maar dunga tujhe",
      "mar ja tu, koi miss nahi karega", "khud ko khatam kar le", "teri photos sabko bhej dunga", "paise de warna teri chats viral kar dunga", "apni photos bhej warna sabko bata dunga",
      "tera munh tod dunga", "chaku maar dunga", "tera ghar jala dunga", "itna peetenge ki school aana band kar dega", "tera address har group mein daal dunga",
    ],
    lead: ["{t}", "{t} milte hai,", "{p} pe mil {t},", "{t} dekhna,", "{n},"],
    ends: ["", "", "!", ".", " bhai", " 😂", " samjha"],
  },
  bn: {
    times: ["কাল", "পরে", "স্কুল ছুটির পর", "বিকালে", "সন্ধ্যায়", "রাতে", "সকালে", "টিউশনের পর", "পাঁচটায়", "টিফিনে", "শুক্রবার"],
    places: ["গেটে", "বাস স্ট্যান্ডে", "ক্যান্টিনে", "মাঠে", "পার্কে", "কোচিংয়ে", "নানুর বাসায়"],
    foods: ["সিঙ্গারা", "বিরিয়ানি", "চিপস", "পিঠা", "আইসক্রিম", "ফুচকা", "চা"],
    things: ["খাতা", "চার্জার", "ব্যাট", "ক্যালকুলেটর", "বই", "হেডফোন"],
    names: ["তানভীর", "নুসরাত", "রাফি", "মিতু", "সাব্বির", "আয়েশা", "রিয়া", "সাকিব", "তিশা", "ফাহিম"],
    kind: [
      "কাল দেখা হবে", "{t} দেখা হবে", "আচ্ছা {t} দেখা হবে", "{t} কথা বলবো", "{t} {p} দেখা করিস", "{p} আমার জন্য অপেক্ষা করিস, {t} আসছি", "আমি {t} তোদের বাসায় আসবো",
      "{t} বাসায় আয়, আম্মু {f} বানিয়েছে", "{t} আমার {x} টা নিয়ে আসিস", "তোর জন্য {f} নিয়ে আসবো?", "{t} খেলা আছে, চলে আসিস", "{t} ফোন দিস, হোমওয়ার্ক বুঝবো",
      "শুভ রাত্রি, {t} দেখা হবে", "বাই, {t} স্কুলে দেখা হবে", "আমার জন্য সিট রাখিস {t}", "আব্বু {t} আমাদের দুজনকে নিয়ে যাবে", "{n} {t} আসবি তো?",
      "{t} {p} দেখা করি, {f} খাবো", "কাউকে বলিস না, {t} {n} এর সারপ্রাইজ পার্টি", "ভালোবাসি দোস্ত, {t} দেখা হবে", "আমি তোকে {p} খুঁজে নেবো, তোর {x} আমার কাছে",
    ],
    harm: [
      "তোর দাঁত ভেঙে দেবো", "তোর হাড় ভেঙে দেবো", "এমন মারবো হাসপাতালে যাবি", "আমার ভাইয়েরা তোকে পেটাবে", "তোকে কেউ বাঁচাতে পারবে না", "তোকে মেরে ফেলবো",
      "মরে যা, কেউ তোকে চায় না", "আত্মহত্যা কর", "তোর ছবি সবাইকে পাঠিয়ে দেবো", "টাকা দে নাহলে তোর চ্যাট ভাইরাল করে দেবো", "নিজের ছবি না দিলে সবার কাছে সব ফাঁস করে দেবো",
      "তোর মুখ ভেঙে দেবো", "ছুরি মেরে দেবো", "তোর বাড়ি জ্বালিয়ে দেবো", "এমন পেটাবো আর স্কুলে আসবি না",
    ],
    lead: ["{t}", "{t} দেখা হবে,", "{t} {p} আসিস,", "{n},"],
    ends: ["", "", "!", "।", " দোস্ত", " 😂"],
  },
  "bn-Latn": {
    times: ["kal", "pore", "school chutir pore", "bikale", "shondhay", "rate", "tuition er pore", "tiffin e"],
    places: ["gate e", "bus stand e", "canteen e", "mather", "park e", "coaching e"],
    foods: ["singara", "biryani", "chips", "fuchka", "ice cream", "cha"],
    things: ["khata", "charger", "bat", "calculator", "boi"],
    names: ["tanvir", "nusrat", "rafi", "mitu", "sabbir", "tisha", "fahim", "sakib"],
    kind: [
      "kal dekha hobe", "{t} dekha hobe", "acha {t} dekha hobe", "{t} {p} dekha korish", "{p} wait korish, {t} ashchi", "ami {t} tor bashay ashbo", "{t} bashay ay, ammu {f} banaiche",
      "tor jonno {f} anbo?", "{t} khela ache, chole ashish", "bye, {t} school e dekha hobe", "{t} phone dish, homework bujhbo", "{n} {t} ashbi to?", "amar jonno seat rakhish {t}",
    ],
    harm: ["tor dat bhenge dibo", "emon marbo hospital e jabi", "tore mere felbo", "more ja, keu tore chay na", "tor chobi sobaike pathiye dibo", "taka de nahole tor chat viral kore dibo", "tor mukh bhenge dibo", "tor haddi bhenge dibo"],
    lead: ["{t}", "{t} dekha hobe,", "{n},"],
    ends: ["", "", "!", " dost", " 😂"],
  },
};

// Seeded RNG, as in build-data.ts.
let seed = 31;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]!;
const fill = (s: string, k: Kit) => s.replace(/\{t\}/g, () => pick(k.times)).replace(/\{p\}/g, () => pick(k.places)).replace(/\{f\}/g, () => pick(k.foods)).replace(/\{x\}/g, () => pick(k.things)).replace(/\{n\}/g, () => pick(k.names));
// Same surface noise for both classes, so casing or an emoji can't become the new shortcut.
const style = (s: string, k: Kit) => {
  let out = s + pick(k.ends);
  const r = rand();
  if (r < 0.2) out = out[0]!.toUpperCase() + out.slice(1);
  else if (r < 0.25) out = out.toUpperCase();
  return out;
};

const PER_LANG = { kind: 170, threat: 120 };
const rows: { text: string; hurtful: 0 | 1; danger: 0 | 1; lang: Lang; kind: string }[] = [];
for (const [kitName, k] of Object.entries(KITS)) {
  const lang = (kitName === "bn-Latn" ? "bn" : kitName) as Lang;
  const scale = kitName === "bn" ? 0.65 : kitName === "bn-Latn" ? 0.35 : 1;
  const seen = new Set<string>();
  const take = (n: number, make: () => string, hurtful: 0 | 1, danger: 0 | 1, kind: string) => {
    for (let tries = 0, got = 0; got < n && tries < n * 30; tries++) {
      const text = make();
      const key = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ text, hurtful, danger, lang, kind });
      got++;
    }
  };
  take(Math.round(PER_LANG.kind * scale), () => style(fill(pick(k.kind), k), k), 0, 0, "contrast-kind");
  // Most threats carry no time or meeting words; about a third start with one, as the contrast.
  take(Math.round(PER_LANG.threat * scale * 0.65), () => style(rand() < 0.4 ? fill(`{n} ${pick(k.harm)}`, k) : pick(k.harm), k), 1, 1, "contrast-threat");
  take(Math.round(PER_LANG.threat * scale * 0.35), () => style(fill(`${pick(k.lead)} ${pick(k.harm)}`, k), k), 1, 1, "contrast-threat-timed");
}

writeFileSync(new URL("./data/contrast.jsonl", import.meta.url), rows.map((r) => JSON.stringify({ ...r, source: "contrast-templates" })).join("\n") + "\n");
const count = rows.reduce<Record<string, number>>((m, r) => ((m[`${r.lang} ${r.kind}`] = (m[`${r.lang} ${r.kind}`] ?? 0) + 1), m), {});
console.log(rows.length, count);
