// The PIN checks, with no storage attached, so they can be tested on their own. A profile's PIN
// is kept as a PBKDF2 hash (store.ts); the vault's PIN is never kept at all, only a sealed
// marker it must open (vault.ts). "Delete everything" asks for either one: on a shared phone, a
// brother or sister who opens Ward can't wipe the evidence.

import { b64, derive, open, unb64 } from "./vaultSeal.ts";

const enc = new TextEncoder();

export async function profilePinHash(pin: string, salt: string) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: unb64(salt), iterations: 310_000, hash: "SHA-256" }, base, 256);
  return b64(bits);
}

export interface Locks {
  profile?: { salt: string; hash: string };
  vault?: { salt: string; check: string };
}

/** Anything to protect with a PIN? With no PIN anywhere, a plain "are you sure" is all there is. */
export const needsPin = (l: Locks) => Boolean(l.profile || l.vault);

/** True if the PIN is this profile's PIN or opens its vault. */
export async function pinOpens(pin: string, l: Locks): Promise<boolean> {
  if (l.profile && (await profilePinHash(pin, l.profile.salt)) === l.profile.hash) return true;
  if (!l.vault) return false;
  try {
    return (await open(await derive(pin, unb64(l.vault.salt)), l.vault.check)) === "ward";
  } catch {
    return false;
  }
}
