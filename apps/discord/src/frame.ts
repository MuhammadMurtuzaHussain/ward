// Is the person writing telling what happened to them, or standing up for someone, rather than
// sending the abuse? "someone told me to kys" and "stop telling Sara to kys" carry the same words
// as the abuse, so the word lists flag them. In server mode such a message must never earn its
// author a nudge to delete it, or send a check-in to whoever it mentions (often the bully).
// Deliberately narrow, because a match hides the sender from moderators: a first-person recipient
// ("someone told me", "mujhe kaha", "আমাকে বলেছে") or an explicit "stop telling" frame, and never
// when the message also talks to "you" or ends in "or else". A bare "someone said", or quotation
// marks alone, never count: a bully could wrap anything in them. English, Roman Urdu / Hinglish
// and Bangla.

import { PackMatcher } from "@ward/engine";

export type Frame = "reporting" | "upstanding";

/**
 * A message that also speaks to someone ("you", "tujhe", "তোকে") or carries a condition ("or
 * else", "warna", "নইলে") reads as a threat, whatever else it says: "the nudes you sent me",
 * "mods ko mat bolo warna ...". Ward can't tell a quoted "you" from a real one, so it treats
 * both as aimed at someone and the alert names the sender as usual.
 */
const VETO: RegExp[] = [
  /\b(you|your|yours|yourself|yourselves|you're|youre|you'll|youll|you've|youve|you'd|u|ur|urself|yall|y'all)\b/,
  /\b(tu|tujhe|tujhko|tujh|tune|tera|teri|tere|tum|tumhe|tumhein|tumko|tumne|tumhara|tumhari|tumhare|aap|aapko|aapne|aapka|aapki|aapke)\b/,
  /\b(tui|toke|tore|tor|tumi|tomake|tomar|tomare|apni|apnake|apnar)\b/,
  /(?<![\p{L}\p{M}])(তুই|তোকে|তোরে|তোর|তোরা|তোদের|তুমি|তোমাকে|তোমারে|তোমার|তোমরা|তোমাদের|আপনি|আপনাকে|আপনার|আপনারা)(?![\p{L}\p{M}])/u,
  /\b(or else|or i|or i'll|or ill|or i'm|or im|or we|or we'll|unless|otherwise|warna|varna|wrna|nahi to|nahi toh|nahin to|nai to|nhi to|nhi toh)\b/,
  /(নইলে|না হলে|নাহলে)|\b(noile|nahole|na hole)\b/,
  // "stop telling me what to do": an order to the reader, not a report. "he won't stop telling me" is.
  /(?<!\b(doesn'?t|won'?t|didn'?t|can'?t|cant|wont|not|never)\s)\b(stop|quit)\s+\w+ing\s+me\b/,
];

/** Who did it, for the English verbs a bully could also use about himself ("sara called me a snitch so ..."). */
const THEY = String.raw`\b(he|she|they|someone|somebody|some1|people|ppl|everyone|everybody|this (guy|girl|kid|person|account)|<@!?\d+>)('s|'re|\s+(is|are|was|were|has|have|had|keeps?|kept|just|also|always|still|even|literally))*\s+`;

/** Someone telling what was done to them: the words were aimed at "me". */
const REPORTING: RegExp[] = [
  // English. Past or ongoing forms only: "send me" and "tell me" are how a bully asks. Never
  // "sent me", "asked me" or "wants me": "the nudes she sent me" is how a bully threatens.
  /\b(told|tells|telling|said to|says to|saying to|messaged|messaging|texted|texting|dm'?e?d|dming|threatened|threatens|threatening|blackmailed|blackmailing|pressured|pressuring|forced|forcing|bullied|bullying|harassed|harassing)\s+me\b/,
  /\b(said|says|saying)\s+i\s+(should|need to|have to|must|deserve)\b/,
  new RegExp(THEY + String.raw`(called|calls|calling)\s+me\b`),
  new RegExp(THEY + String.raw`(posted|posting|shared|sharing|leaked|leaking|spread|spreading|threatened to \w+|threatening to \w+)\s+(my|our)\b`),
  // Roman Urdu / Hinglish: "usne mujhe bola mar ja", "wo mujhe roz gaali deta hai". Not "mujhe
  // bhej" (send me).
  /\b(mujhe|mujhko|mujh ko|mjhe|muje|mujhay|mujhey|mujhse|mujh se|mjhse)\s+(\S+\s+){0,4}?(kaha|kha|kahaa|kehta|kehti|kehte|kehtay|keh raha|keh rahi|keh rahe|keh diya|keh di|bola|boli|bole|bolta|bolti|bolte|boltay|bol raha|bol rahi|bol rahe|bol diya|bol di|likha|likhta|likhti|bheja|bheji|bhejta|bhejti|bhejte|bhej raha|bhej rahi|bhej rahe|dhamki|dhamkiyan|dhamkaya|dhamkata|dhamkati|dhamka raha|dhamka rahi|blackmail|message kiya|msg kiya|text kiya|tang kar|pareshan kar|gaali|gali)\b/,
  /\b(meri|mere)\s+(\S+\s+){0,2}?(pics?|photos?|tasveer\w*|videos?|number)\b.*\b(leak|viral|share|post|daal|dhamki)/,
  // Bangla: "আমাকে বলেছে" (told me), "আমাকে হুমকি দিয়েছে" (threatened me), and the Latin spelling.
  /(^|\s)(আমাকে|আমারে|আমায়)\s+(\S+\s+){0,3}?(বলেছে|বলছে|বলল|বললো|বলে|বলেছিল|বলছিল|বলতেছে|বলসে|হুমকি|পাঠিয়েছে|পাঠাচ্ছে|পাঠাইছে|লিখেছে|ডেকেছে|ডাকছে|ডাকে|ব্ল্যাকমেইল|গালি)/,
  /আমার\s+(\S+\s+){0,2}?(ছবি|ভিডিও|নম্বর)\S*\s+.*(ছড়িয়ে|ছড়াবে|ফাঁস|লিক|পোস্ট|ভাইরাল)/,
  /\b(amake|amare|amay)\s+(\S+\s+){0,3}?(boleche|bolche|bolse|bollo|bolechilo|bolchilo|bole|humki|hmki|pathiyeche|pathacche|pathaise|pathaiche|likheche|dakche|dake|gali)\b/,
];

/** Someone telling the sender to stop. Never "stop ... me". */
const UPSTANDING: RegExp[] = [
  /\b(stop|quit)\s+(telling|calling|saying|sending|threatening|bullying|harassing|messaging|dming|picking on|making fun of)\b(?!\s+me\b)/,
  /\bleave\s+(?!me\b)\S+\s+alone\b/,
  /\b(not|isn't|is not|never)\s+(ok|okay|cool|funny)\s+to\s+(say|tell|call)\b/,
  /\b(aisa|aise|aesa|esa)\s+mat\s+(bolo|bol|kaho|likho)\b/,
  /\b(bolna|kehna|likhna|tang karna|pareshan karna)\s+band\s+kar/,
  /(^|\s)(?!kisi\b|tujh\b|tum\b)(usko|usay|isko|isay|\S+ ko)\s+(chhod|chor|chod)\s+do\b/,
  /(বলা|লেখা|ডাকা|জ্বালানো)\s+বন্ধ\s+(কর|করো|করেন)/,
];

/**
 * "Sara ko kys mat bolo", "ওকে মরে যা বলিস না": don't say <abuse> to them. The words between
 * must be abuse Ward knows, because "ammi ko mat bolo" and "বাবাকে কিছু বলিস না" (don't tell
 * your mum, don't tell dad anything) are how a threat ends. Group 2 is the words between.
 */
const SAY_IT_TO: RegExp[] = [
  /(^|\s)(?:(?!kisi\b|kissi\b)\S+ ko|isko|usko|unko|inko|isay|usay|ise|use)\s+((?:\S+\s+){1,3}?)(?:mat|na|nah)\s+(?:bolo|bol|kaho|kah|keh|likho|bhejo)\b/g,
  /(^|\s)(?:(?!কাউকে|কাউরে|আমাকে)\S+কে|ওরে|তারে)\s+((?:\S+\s+){1,3}?)(?:বলিস না|বলবি না|বলবে না|বোলো না|বলবেন না)/g,
];

/** "kisi ko mat batana", "don't tell anyone": how a threat or grooming ends, never an upstander. */
const TELL_NOBODY = /\b(kisi ko|kissi ko|don'?t tell (anyone|anybody|no ?one|nobody)|dont tell (anyone|anybody|no ?one|nobody))\b|কাউকে|কাউরে/;

/**
 * Wider than the frames above, and only ever used to hold back a nudge: "he sent me this: ur
 * ugly" or "usne mujhe kaha tu moti hai" may be a report even though Ward can't be sure enough to
 * hide who wrote it. Skipping a nudge lowers no alert and drops no check-in.
 */
const MAYBE: RegExp[] = [
  /\b(sent|sends|sending|asked|asks|asking|wants|wanted|called|calls|calling)\s+me\b/,
  /\b(posted|posting|shared|sharing|leaked|leaking|spread|spreading)\s+(my|our)\b/,
];

let words: PackMatcher | undefined;
const isAbuse = (s: string) => (words ??= new PackMatcher()).match(s).length > 0;

const clean = (text: string) => text.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim();
const sayItTo = (t: string) => SAY_IT_TO.some((re) => [...t.matchAll(re)].some((m) => isAbuse(m[2]!)));

export function frameOf(text: string): Frame | null {
  const t = clean(text);
  if (VETO.some((re) => re.test(t))) return null;
  if (REPORTING.some((re) => re.test(t))) return "reporting";
  if (TELL_NOBODY.test(t)) return null;
  if (UPSTANDING.some((re) => re.test(t)) || sayItTo(t)) return "upstanding";
  return null;
}

/** Could this be someone telling what happened, or standing up for someone? Enough to skip a nudge, nothing more. */
export function maybeFramed(text: string): boolean {
  const t = clean(text);
  return [...REPORTING, ...UPSTANDING, ...MAYBE].some((re) => re.test(t)) || sayItTo(t);
}
