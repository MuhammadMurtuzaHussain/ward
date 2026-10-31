// Is the person writing telling what happened to them, or standing up for someone, rather than
// sending the abuse? "someone told me to kys" and "stop telling Sara to kys" carry the same words
// as the abuse, so the word lists flag them. In server mode such a message must never earn its
// author a nudge to delete it, or send a check-in to whoever it mentions (often the bully).
// Deliberately narrow: a first-person recipient ("told me", "mujhe kaha", "আমাকে বলেছে") or an
// explicit "stop telling" frame. A bare "someone said", or quotation marks alone, never count:
// a bully could wrap anything in them. English, Roman Urdu / Hinglish and Bangla.

export type Frame = "reporting" | "upstanding";

/** Someone telling what was done to them: the words were aimed at "me". */
const REPORTING: RegExp[] = [
  // English. Past or ongoing forms only: "send me" and "tell me" are how a bully asks.
  /\b(told|tells|telling|said to|says to|saying to|asked|asks|asking|messaged|messaging|texted|texting|dm'?e?d|dming|called|calls|calling|threatened|threatens|threatening|blackmailed|blackmailing|pressured|pressuring|forced|forcing|bullied|bullying|harassed|harassing|wants|wanted|sent|sends|sending)\s+me\b/,
  /\b(said|says|saying)\s+i\s+(should|need to|have to|must|deserve)\b/,
  /\b(posted|posting|shared|sharing|leaked|leaking|spread|spreading|threatened to \w+|threatening to \w+)\s+(my|our)\b/,
  // Roman Urdu / Hinglish: "usne mujhe bola", "mujhe kaha mar ja". Not "mujhe bhej" (send me).
  /\b(mujhe|mujhko|mujh ko|mjhe|muje|mujhay|mujhey|mujhse|mujh se|mjhse)\s+(\S+\s+){0,4}?(kaha|kha|kahaa|kehta|kehti|kehte|kehtay|keh raha|keh rahi|keh rahe|keh diya|keh di|bola|boli|bole|bolta|bolti|bolte|boltay|bol raha|bol rahi|bol rahe|bol diya|bol di|likha|likhta|likhti|bheja|bheji|bhejta|bhejti|bhejte|bhej raha|bhej rahi|bhej rahe|dhamki|dhamkiyan|dhamkaya|dhamkata|dhamkati|dhamka raha|dhamka rahi|blackmail|message kiya|msg kiya|text kiya|tang kar|pareshan kar|gaali|gali)\b/,
  /\b(meri|mere)\s+(\S+\s+){0,2}?(pics?|photos?|tasveer\w*|videos?|number)\b.*\b(leak|viral|share|post|daal|dhamki)/,
  // Bangla: "আমাকে বলেছে" (told me), "আমাকে হুমকি দিয়েছে" (threatened me), and the Latin spelling.
  /(^|\s)(আমাকে|আমারে|আমায়)\s+(\S+\s+){0,3}?(বলেছে|বলছে|বলল|বললো|বলে|বলেছিল|বলছিল|বলতেছে|বলসে|হুমকি|পাঠিয়েছে|পাঠাচ্ছে|পাঠাইছে|লিখেছে|ডেকেছে|ডাকছে|ডাকে|ব্ল্যাকমেইল|গালি)/,
  /আমার\s+(\S+\s+){0,2}?(ছবি|ভিডিও|নম্বর)\S*\s+.*(ছড়িয়ে|ছড়াবে|ফাঁস|লিক|পোস্ট|ভাইরাল)/,
  /\b(amake|amare|amay)\s+(\S+\s+){0,3}?(boleche|bolche|bolse|bollo|bolechilo|bolchilo|bole|humki|hmki|pathiyeche|pathacche|pathaise|pathaiche|likheche|dakche|dake|gali)\b/,
];

/** Someone telling the sender to stop. Never "stop ... me", and never "don't tell anyone". */
const UPSTANDING: RegExp[] = [
  /\b(stop|quit)\s+(telling|calling|saying|sending|threatening|bullying|harassing|messaging|dming|picking on|making fun of)\b(?!\s+me\b)/,
  /\bleave\s+(?!me\b)\S+\s+alone\b/,
  /\b(not|isn't|is not|never)\s+(ok|okay|cool|funny)\s+to\s+(say|tell|call)\b/,
  /\b(you can't|you cant|you can not|you cannot|why would you|why did you)\s+(say|tell|call)\b/,
  // Roman Urdu / Hinglish: "Sara ko kys mat bolo", "aisa mat bolo", "bolna band karo". Not
  // "kisi ko mat bolo" (don't tell anyone), which is how threats end.
  /(^|\s)(?!kisi\b|kissi\b|tujh\b|tum\b|aap\b)(\S+ ko|isko|usko|unko|inko|isay|usay|ise|use)\s+(\S+\s+){0,3}?(mat|na|nah)\s+(bolo|bol|kaho|kah|keh|likho|bhejo)\b/,
  /\b(aisa|aise|aesa|esa|ye|yeh)\s+mat\s+(bolo|bol|kaho|likho)\b/,
  /\b(bolna|kehna|likhna|tang karna|pareshan karna)\s+band\s+kar/,
  /(^|\s)(?!kisi\b|tujh\b|tum\b)(usko|usay|isko|isay|\S+ ko)\s+(chhod|chor|chod)\s+do\b/,
  // Bangla: "ওকে এসব বলিস না" (don't say this to them), "বলা বন্ধ কর" (stop saying it). Not
  // "কাউকে বলিস না" (don't tell anyone) or "তোকে ..." (you).
  /(^|\s)(?!তোকে|তোমাকে|তোমারে|আপনাকে|কাউকে|কাউরে|আমাকে)(\S+কে|ওরে|তারে)\s+(\S+\s+){0,3}?(বলিস না|বলবি না|বলবে না|বোলো না|বলবেন না)/,
  /(বলা|লেখা|ডাকা|জ্বালানো)\s+বন্ধ\s+(কর|করো|করেন)/,
];

/** "told me to tell you": a sender passing the abuse on, not reporting it. */
const RELAY = [/\bto\s+(tell|say|send|pass|give)\s+((it|this|that)\s+)?(to\s+)?(you|u|ya)\b/,/\b(tujhe|tujhko|tumhe|tumko|aapko)\s+(\S+\s+){0,3}?(bolun|bolu|kahun|kahu|bolne|kehne)\b/];

export function frameOf(text: string): Frame | null {
  const t = text.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim();
  if (RELAY.some((re) => re.test(t))) return null;
  if (REPORTING.some((re) => re.test(t))) return "reporting";
  if (UPSTANDING.some((re) => re.test(t))) return "upstanding";
  return null;
}
