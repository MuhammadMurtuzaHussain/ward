// Who to call. Checked against Child Helpline International and national sources on 2026-10-29;
// anyone adding a country should cite where the number came from in the pull request.
// findahelpline.com covers everywhere else.

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
  emergency: string;
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
];

export function guessRegion(): Region {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const id = tz === "Asia/Karachi" ? "PK" : tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "IN" : tz === "Asia/Dhaka" ? "BD" : tz.startsWith("Europe/London") ? "GB" : tz.startsWith("America/") ? "US" : "PK";
  return REGIONS.find((r) => r.id === id)!;
}

export const ELSEWHERE = { name: "Find A Helpline", url: "https://findahelpline.com", note: "Free, confidential helplines in more than 130 countries." };
export const TAKE_IT_DOWN = {
  name: "Take It Down",
  url: "https://takeitdown.ncmec.org",
  note: "Helps remove nude or sexual images of under-18s from the internet, even ones you sent.",
  noteUr: "18 سال سے کم عمر بچوں کی برہنہ یا جنسی تصویریں انٹرنیٹ سے ہٹوانے میں مدد کرتا ہے، چاہے وہ آپ نے خود بھیجی ہوں۔",
};
