// Who to call. Checked against Child Helpline International and national sources on 2026-10-29;
// anyone adding a country should cite where the number came from in the pull request.
// findahelpline.com covers everywhere else.

export interface HelpLine {
  name: string;
  number: string;
  note: string;
}

export interface Region {
  id: string;
  name: string;
  emergency: string;
  lines: HelpLine[];
}

export const REGIONS: Region[] = [
  {
    id: "PK",
    name: "Pakistan",
    emergency: "15",
    lines: [{ name: "Madadgaar National Helpline", number: "1098", note: "For children and women facing abuse or violence." }],
  },
  {
    id: "IN",
    name: "India",
    emergency: "112",
    lines: [{ name: "Childline", number: "1098", note: "Free, 24 hours, every day." }],
  },
  {
    id: "BD",
    name: "Bangladesh",
    emergency: "999",
    lines: [{ name: "Child Helpline", number: "1098", note: "Free from any phone in Bangladesh." }],
  },
  {
    id: "GB",
    name: "United Kingdom",
    emergency: "999",
    lines: [{ name: "Childline", number: "0800 1111", note: "Free, confidential, any time. Online chat at childline.org.uk." }],
  },
  {
    id: "US",
    name: "United States",
    emergency: "911",
    lines: [{ name: "988 Suicide & Crisis Lifeline", number: "988", note: "Call or text, 24 hours." }],
  },
];

export function guessRegion(): Region {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const id = tz === "Asia/Karachi" ? "PK" : tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "IN" : tz === "Asia/Dhaka" ? "BD" : tz.startsWith("Europe/London") ? "GB" : tz.startsWith("America/") ? "US" : "PK";
  return REGIONS.find((r) => r.id === id)!;
}

export const ELSEWHERE = { name: "Find A Helpline", url: "https://findahelpline.com", note: "Free, confidential helplines in more than 130 countries." };
export const TAKE_IT_DOWN = { name: "Take It Down", url: "https://takeitdown.ncmec.org", note: "Helps remove nude or sexual images of under-18s from the internet, even ones you sent." };
