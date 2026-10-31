// Who to call. Checked against Child Helpline International and national sources on 2026-10-29;
// anyone adding a country should cite where the number came from, here and in the pull request.
// findahelpline.com covers everywhere else, and an unknown time zone never guesses a country.

export interface HelpLine {
  name: string;
  nameUr?: string;
  number: string;
  note: string;
  /** The note in Urdu, for lines in Pakistan. */
  noteUr?: string;
}

export interface Region {
  id: string;
  name: string;
  nameUr?: string;
  /** Null where no official source confirmed one: Ward then says "your local emergency number". */
  emergency: string | null;
  /** False where the source doesn't say the lines are free to call, so Ward doesn't promise it. */
  free?: boolean;
  lines: HelpLine[];
}

export const REGIONS: Region[] = [
  {
    id: "PK",
    name: "Pakistan",
    nameUr: "پاکستان",
    emergency: "15",
    lines: [
      { name: "Madadgaar National Helpline", number: "1098", note: "For children and women facing abuse or violence.", noteUr: "بدسلوکی یا تشدد کا سامنا کرنے والے بچوں اور خواتین کے لیے۔" },
      {
        name: "DRF Cyber Harassment Helpline",
        number: "0800-39393",
        note: "Online harassment, blackmail and leaked photos, and help with a cybercrime complaint. Weekdays 9am to 5pm.",
        noteUr: "آن لائن ہراسانی، بلیک میل اور لیک ہونے والی تصویروں میں مدد، اور سائبر کرائم کی شکایت میں مدد۔ پیر سے جمعہ، صبح 9 سے شام 5 بجے۔",
      },
    ],
  },
  {
    id: "IN",
    name: "India",
    nameUr: "بھارت",
    emergency: "112",
    lines: [{ name: "Childline", number: "1098", note: "Free, 24 hours, every day.", noteUr: "مفت، ہر روز، چوبیس گھنٹے۔" }],
  },
  {
    id: "BD",
    name: "Bangladesh",
    nameUr: "بنگلہ دیش",
    emergency: "999",
    lines: [{ name: "Child Helpline", number: "1098", note: "Free from any phone in Bangladesh.", noteUr: "بنگلہ دیش میں کسی بھی فون سے مفت۔" }],
  },
  {
    id: "GB",
    name: "United Kingdom",
    nameUr: "برطانیہ",
    emergency: "999",
    lines: [{ name: "Childline", number: "0800 1111", note: "Free, confidential, any time. Online chat at childline.org.uk.", noteUr: "مفت اور راز میں، کسی بھی وقت۔ childline.org.uk پر آن لائن چیٹ بھی۔" }],
  },
  {
    id: "US",
    name: "United States",
    nameUr: "امریکہ",
    emergency: "911",
    lines: [{ name: "988 Suicide & Crisis Lifeline", number: "988", note: "Call or text, 24 hours.", noteUr: "کال یا میسج، چوبیس گھنٹے۔" }],
  },
  // https://u.ae/en/information-and-services/justice-safety-and-the-law/Safety/children-safety and
  // https://u.ae/en/information-and-services/justice-safety-and-the-law/Safety/handling-emergencies
  // (both "Updated on: 01 Oct 2026"), checked 2026-10-31.
  {
    id: "AE",
    name: "United Arab Emirates",
    nameUr: "متحدہ عرب امارات",
    emergency: "999",
    free: false,
    lines: [
      { name: "Child Protection Centre", number: "116111", note: "The Ministry of Interior's line for any child who is being hurt or put at risk.", noteUr: "وزارتِ داخلہ کی لائن، ہر اس بچے کے لیے جسے تکلیف دی جا رہی ہو یا خطرے میں ڈالا جا رہا ہو۔" },
      { name: "Child Protection Unit", number: "80085", note: "The Ministry of Education's line. You can call it about bullying too.", noteUr: "وزارتِ تعلیم کی لائن۔ بُلیئنگ کے بارے میں بھی یہاں کال کر سکتے ہیں۔" },
    ],
  },
  // https://childhelplineinternational.org/saudi-arabia/, checked 2026-10-31. No official page for
  // the emergency number could be fetched (911 covers only some regions), so it is left out.
  {
    id: "SA",
    name: "Saudi Arabia",
    nameUr: "سعودی عرب",
    emergency: null,
    lines: [{ name: "Child Helpline", number: "116111", note: "Free, in Arabic and English, 7am to 11pm every day.", noteUr: "مفت، عربی اور انگریزی میں، ہر روز صبح 7 سے رات 11 بجے تک۔" }],
  },
];

/** Not one of the countries above. Ward then shows Find A Helpline first and no number at all,
 *  because a wrong emergency number is worse than none. */
export const OTHER = "OTHER";

// Time zones Ward can place in one country. A zone family that crosses borders (America/* is
// also Canada, Mexico and Brazil) is listed zone by zone, never matched by prefix.
const ZONES: Record<string, string> = {
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dhaka": "BD",
  "Asia/Dacca": "BD",
  "Europe/London": "GB",
  "Europe/Belfast": "GB",
  GB: "GB",
  "GB-Eire": "GB",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
};
for (const z of [
  "America/New_York", "America/Detroit", "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/Louisville",
  "America/Indiana/Indianapolis", "America/Indiana/Vincennes", "America/Indiana/Winamac", "America/Indiana/Marengo", "America/Indiana/Petersburg",
  "America/Indiana/Vevay", "America/Indiana/Tell_City", "America/Indiana/Knox", "America/Indianapolis", "America/Fort_Wayne", "America/Knox_IN",
  "America/Chicago", "America/Menominee", "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/North_Dakota/Beulah",
  "America/Denver", "America/Boise", "America/Phoenix", "America/Shiprock", "America/Los_Angeles",
  "America/Anchorage", "America/Juneau", "America/Sitka", "America/Metlakatla", "America/Yakutat", "America/Nome", "America/Adak", "America/Atka",
  "Pacific/Honolulu", "US/Eastern", "US/Central", "US/Mountain", "US/Pacific", "US/Alaska", "US/Hawaii", "US/Arizona", "US/Michigan",
  "US/Aleutian", "US/East-Indiana", "US/Indiana-Starke", "Navajo",
])
  ZONES[z] = "US";

/** The country for a time zone, or OTHER when Ward can't be sure. */
export function regionForZone(tz: string): string {
  return ZONES[tz] ?? OTHER;
}

function deviceZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

/** The child's own pick wins; otherwise a guess from the time zone. */
export function chooseRegion(saved: string | null | undefined, tz = deviceZone()): string {
  if (saved && (saved === OTHER || REGIONS.some((r) => r.id === saved))) return saved;
  return regionForZone(tz);
}

/** The helplines for a pick, or null for OTHER. */
export function regionById(id: string): Region | null {
  return REGIONS.find((r) => r.id === id) ?? null;
}

export const ELSEWHERE = { name: "Find A Helpline", url: "https://findahelpline.com", note: "Free, confidential helplines in more than 130 countries." };
export const TAKE_IT_DOWN = {
  name: "Take It Down",
  url: "https://takeitdown.ncmec.org",
  note: "Helps remove nude or sexual images of under-18s from the internet, even ones you sent.",
  noteUr: "18 سال سے کم عمر بچوں کی برہنہ یا جنسی تصویریں انٹرنیٹ سے ہٹوانے میں مدد کرتا ہے، چاہے وہ آپ نے خود بھیجی ہوں۔",
};
