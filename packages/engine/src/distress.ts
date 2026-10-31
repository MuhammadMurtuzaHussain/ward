// The child's own words, read for one thing only: do they sound like a child who wants to die or
// to hurt themselves? Ward reads everyone else's messages for what is aimed at the child; this is
// the one place it reads the child's own, and only to offer care, never to judge them.
//
// First person only ("i want to die", "main marna chahti hoon", "আমি মরে যেতে চাই"). The packs
// hold the second person ("kill yourself"), which is abuse; this list holds what a child says
// about themselves, which is a disclosure. Kids say "i'm dying 😂" and "hans hans ke mar gayi"
// all day, so the hyperbole is left out, and the softer phrases ("wanna die", "kms") don't count
// next to a laugh. The strong ones count even with "lol": real distress is often hidden in one.
//
// English is written from safe-messaging and crisis-line guidance. The Roman Urdu, Hinglish, Urdu,
// Hindi and Bangla entries are a first draft and NEED REVIEW BY A NATIVE SPEAKER before anyone
// relies on them (docs/HARMS.md). The test set is eval/distress/cases.jsonl.

export interface DistressHit {
  /** The words that matched, as written. */
  term: string;
  lang: "en" | "ur-Latn/hi-Latn" | "ur" | "hi" | "bn" | "bn-Latn";
}

interface Entry {
  re: RegExp;
  lang: DistressHit["lang"];
  /** Soft: hyperbole kids also use for fun, so a laugh next to it means it doesn't count. */
  soft?: boolean;
}

/** Not "told me to kill myself", "wants me to kill myself": that is a report of abuse, not distress. */
const NOT_QUOTED = String.raw`(?<!\b(?:(?:told|tell|tells|telling|said|says|saying|asked|asks|asking|keeps?\s+saying)\s+(?:me\s+)?|(?:wants?|wanted)\s+me\s+)(?:to|that i should|i should)\s+)`;
/** "i would never hurt myself". */
const NOT_NEVER = String.raw`(?<!\bnever\s+(?:\w+\s+)?)`;

const ENTRIES: Entry[] = [
  // English, strong.
  { lang: "en", re: new RegExp(NOT_QUOTED + NOT_NEVER + String.raw`\b(kill|killing|end|ending)\s+myself\b(?!\s+laugh)`) },
  { lang: "en", re: new RegExp(NOT_QUOTED + NOT_NEVER + String.raw`\b(want|wanna|going|gonna|go|will|should|might|could|think about|thinking about|thinking of|feel like|felt like|keep|kept|started|start|been)\s+(to\s+)?(hurt|hurting|harm|harming|cut|cutting|burn|burning|starve|starving)\s+myself\b`) },
  { lang: "en", re: /\b(cut|cutting|hurt|hurting|harmed|harming)\s+myself\s+again\b|\bself[\s-]?harm(ing|ed)?\b|\b(i've|ive|i have|i)\s+been\s+cutting\b/ },
  { lang: "en", re: /\b(end|ending|take|taking)\s+my\s+(own\s+)?life\b|\bend\s+it\s+all\b/ },
  { lang: "en", re: /\b(i'm|im|i am|feeling|feel|felt|been|being)\s+(so\s+|really\s+|kinda\s+|a bit\s+)?suicidal\b|\b(think|thinking|thought|thoughts)\s+(about|of)\s+(suicide|dying|ending it)\b/ },
  { lang: "en", re: /\b(wish|wished)\s+(i\s+)?(was|were|i'd|had)\s+(dead|never born|never been born|not born|gone)\b|\bwish\s+i\s+could\s+(die|disappear forever|stop existing)\b/ },
  { lang: "en", re: /\b(don't|dont|do not|didn't|didnt)\s+want\s+to\s+(live|be alive|exist|be here\s+any\s?more)\b/ },
  { lang: "en", re: /\b(no reason|no point)\s+(to|in)\s+(live|living|being alive)\b|\bnothing\s+(left\s+)?to\s+live\s+for\b/ },
  { lang: "en", re: /\bbetter\s+off\s+(dead|without\s+me)\b|\bbe\s+better\s+without\s+me\b/ },
  { lang: "en", re: /\b(no ?one|nobody|noone)\s+(would|will|'?d)\s+(even\s+)?(miss me|care if i (died|was gone|disappeared))\b/ },
  // English, soft.
  { lang: "en", soft: true, re: /\b(i\s+)?(want|wanna|wanted)\s+(to\s+)?die\b|\bkms\b|\b(don't|dont|do not)\s+want\s+to\s+wake\s+up\b/ },

  // Roman Urdu and Hinglish (one way of writing both). NEEDS NATIVE-SPEAKER REVIEW.
  { lang: "ur-Latn/hi-Latn", re: /\b(khudkushi|khudkhushi|khud kushi|khudkashi|suicide)\s+(kar\s+)?(lunga|lungi|loon|lun|lu|karunga|karungi|karoon|karun|karna chahta|karna chahti|ka (soch|sochta|sochti|khayal|khyal|mann|man))/ },
  { lang: "ur-Latn/hi-Latn", re: /\bkhud\s+ko\s+(khatam|khtm|maar|mar|hurt|nuksan|nuqsan|nuksaan|zakhmi|kaat|kat)\b/ },
  { lang: "ur-Latn/hi-Latn", re: /\bmar(na)?\s+(jana\s+)?(chahta|chahti|chahtha|chahthi|chahte)\b|\bmujhe\s+mar\s+jana\s+hai\b/ },
  { lang: "ur-Latn/hi-Latn", re: /\b(jeene|jeena|jine|jina|jeenay|zinda rehne)\s+(ka\s+|ko\s+)?(mann|man|mn|dil)\s+(nahi|nahin|nai|nhi)\b|\b(jeena|jina)\s+(nahi|nahin|nai|nhi)\s+(chahta|chahti)\b/ },
  { lang: "ur-Latn/hi-Latn", re: /\b(zindagi|zindagee|life)\s+(khatam|khtm)\s+kar\s+(dunga|dungi|du|doon|lunga|lungi|lun|loon)\b/ },
  { lang: "ur-Latn/hi-Latn", re: /\b(koi|kisi ko)\s+(mujhe\s+)?(miss|yaad)\s+(nahi|nahin|nai|nhi)\s+kare(ga|gi)\b|\b(mere|meray)\s+(bina|baghair|bagair)\s+sab\s+(behtar|khush)\b/ },
  { lang: "ur-Latn/hi-Latn", soft: true, re: /\b(main|mai|mein|me)\s+mar\s+(jaun|jaon|jaoon|jau|jaunga|jaungi|jaoonga|jaoongi|jaunga|jaongi)\b/ },

  // Urdu script. NEEDS NATIVE-SPEAKER REVIEW.
  { lang: "ur", re: /خودکشی\s*(کر\s*لوں|کرلوں|کروں|کرنا\s*چاہ|کا\s*سوچ)|خود\s*کو\s*(ختم|نقصان|مار|زخمی)|مرنا\s*چاہت|مر\s*جانا\s*چاہت|جینے\s*کا\s*(دل|من)\s*نہیں|زندگی\s*ختم\s*کر\s*(دوں|لوں)/u },
  // Hindi (Devanagari). NEEDS NATIVE-SPEAKER REVIEW.
  { lang: "hi", re: /आत्महत्या\s*(कर\s*लूं|कर\s*लूँ|करूं|करूँ|करना\s*चाह)|ख़?ुद\s*को\s*(ख़?त्म|मार|नुकसान)|मरना\s*चाहत|मर\s*जाना\s*चाहत|जीने\s*का\s*(मन|दिल)\s*नहीं/u },

  // Bangla. NEEDS NATIVE-SPEAKER REVIEW.
  { lang: "bn", re: /মরে\s*যেতে\s*(চাই|ইচ্ছে|ইচ্ছা)|(আত্মহত্যা|সুইসাইড)\s*(করব|করবো|করতে\s*চাই|করে\s*ফেলব|করার\s*কথা)|নিজেকে\s*(শেষ|মেরে|কেটে|আঘাত|ক্ষতি)|(বাঁচতে|বাচতে|বেঁচে\s*থাকতে)\s*(ইচ্ছে|ইচ্ছা|মন)\s*(করে|হয়|করছে)\s*না|আর\s*বাঁচতে\s*চাই\s*না|আমি\s*না\s*থাকলে\s*সবা(ই|র)\s*ভাল|কেউ\s*আমাকে\s*মিস\s*করবে\s*না/u },
  { lang: "bn-Latn", re: /\bmore\s+jete\s+(chai|icche|issa|iccha)\b|\b(atmohotta|attohotta|attohatta|suicide)\s+(korbo|korte\s+chai|kore\s+felbo)\b|\bnijeke\s+(shesh|sesh|mere|kete)\b|\b(bachte|baachte|beche\s+thakte)\s+(icche|issa|iccha|mon)\s+(kore|hoy)\s+na\b/ },
];

/** A laugh next to a soft phrase: "i wanna die 😂", "main mar jaungi hanste hanste". */
const LAUGH = /\b(lol+|lmao+|lmfao|rofl|ha(ha)+|he(he)+|xd|jk|just kidding|hans\s+hans|hanste\s+hanste|has\s+has|hass\s+hass|hasi|hansi)\b|😂|🤣|💀|😆|😹|ہنس\s*ہنس|हँस|हंस|হাসতে\s*হাসতে|হেসে|হাহা/iu;

const clean = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/[​-‍⁠﻿­]/g, "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    // "dieeee", "myselffff": a stretched word is still the word.
    .replace(/(\p{L})\1{2,}/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();

/** The child sounds like they want to die or to hurt themselves, in their own words. */
export function selfDistress(text: string): DistressHit | null {
  const t = clean(text);
  const laughing = LAUGH.test(t);
  for (const e of ENTRIES) {
    if (e.soft && laughing) continue;
    const m = e.re.exec(t);
    if (m) return { term: m[0].trim(), lang: e.lang };
  }
  return null;
}
