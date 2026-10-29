import { kitEn, type Kit } from "./kit.en.ts";
import { kitUr } from "./kit.ur.ts";
import type { Lang } from "./store.ts";

export type { Kit };
export const KIT: Record<Lang, Kit> = { en: kitEn, ur: kitUr };
