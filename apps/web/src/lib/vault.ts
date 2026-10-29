// The evidence vault. Saved chats are encrypted with AES-GCM under a key derived from the
// child's PIN (PBKDF2, 310k rounds) and kept in IndexedDB on this device. The PIN is never
// stored; a small encrypted marker lets Ward check it. Each saved message also gets a SHA-256
// fingerprint, so a printed report can show the evidence wasn't edited after saving.

import { fingerprintMessages, type Analysis, type Chat } from "@ward/engine";
import { getState, onProfileLeave, updateProfile, vaultDbName } from "./store.ts";

const STORE = "items";
const enc = new TextEncoder();
const dec = new TextDecoder();

export interface VaultItem {
  id: string;
  savedAt: number;
  title: string;
  self: string | null;
  chat: Chat;
  analysis: Analysis;
  /** sha256 of "sender|iso time|text" per message, in order. */
  fingerprints: string[];
  note?: string;
}

let key: CryptoKey | null = null;
// A vault never stays open when the person using Ward changes.
onProfileLeave(() => {
  key = null;
});

const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pin: string, salt: Uint8Array<ArrayBuffer>) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 310_000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function seal(k: CryptoKey, data: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, enc.encode(data));
  return `${b64(iv)}.${b64(ct)}`;
}

async function open(k: CryptoKey, sealed: string) {
  const [iv, ct] = sealed.split(".");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv!) }, k, unb64(ct!));
  return dec.decode(pt);
}

export const hasPin = () => Boolean(getState().profile.vaultSalt);
export const isUnlocked = () => key !== null;
export const lock = () => {
  key = null;
};

export async function createPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  key = await derive(pin, salt);
  updateProfile({ vaultSalt: b64(salt), vaultCheck: await seal(key, "ward") });
}

export async function unlock(pin: string): Promise<boolean> {
  const { vaultSalt, vaultCheck } = getState().profile;
  if (!vaultSalt || !vaultCheck) return false;
  const k = await derive(pin, unb64(vaultSalt));
  try {
    if ((await open(k, vaultCheck)) !== "ward") return false;
    key = k;
    return true;
  } catch {
    return false;
  }
}

function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(vaultDbName(), 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((res, rej) => {
        const t = d.transaction(STORE, mode);
        // Close every connection when done, or a later wipe() is blocked and the data stays.
        t.oncomplete = t.onabort = t.onerror = () => d.close();
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      }),
  );
}

export const fingerprint = (chat: Chat) => fingerprintMessages(chat);

/** Dates don't survive JSON; bring them back on the way out. */
function revive(item: VaultItem): VaultItem {
  const fix = (m: { at: string | Date | null }) => {
    m.at = m.at ? new Date(m.at) : null;
  };
  item.chat.messages.forEach(fix);
  item.chat.events.forEach(fix as never);
  item.analysis.findings.forEach((f) => fix(f.message));
  return item;
}

export async function save(item: Omit<VaultItem, "fingerprints" | "savedAt">) {
  if (!key) throw new Error("locked");
  const full: VaultItem = { ...item, savedAt: Date.now(), fingerprints: await fingerprint(item.chat) };
  const blob = await seal(key, JSON.stringify(full));
  await tx("readwrite", (s) => s.put({ id: item.id, blob }));
  updateProfile((p) => ({ checks: p.checks.map((c) => (c.id === item.id ? { ...c, saved: true } : c)) }));
}

export async function list(): Promise<VaultItem[]> {
  if (!key) throw new Error("locked");
  const rows = await tx<{ id: string; blob: string }[]>("readonly", (s) => s.getAll());
  const out: VaultItem[] = [];
  for (const r of rows) {
    if (r.id === PLAN_ID) continue;
    try {
      out.push(revive(JSON.parse(await open(key, r.blob))));
    } catch {
      // A row from an older PIN: skip rather than fail the whole list.
    }
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

export async function remove(id: string) {
  await tx("readwrite", (s) => s.delete(id));
  updateProfile((p) => ({ checks: p.checks.map((c) => (c.id === id ? { ...c, saved: false } : c)) }));
}

// The teen safety plan: one more sealed row in the same vault, under the same PIN.
export interface SafetyPlan {
  signs: string[];
  calm: string[];
  places: string[];
  people: string[];
  space: string[];
  updatedAt: number;
}
const PLAN_ID = "__plan";
export const emptyPlan = (): SafetyPlan => ({ signs: [], calm: [], places: [], people: [], space: [], updatedAt: 0 });

export async function savePlan(plan: SafetyPlan) {
  if (!key) throw new Error("locked");
  const blob = await seal(key, JSON.stringify({ ...plan, updatedAt: Date.now() }));
  await tx("readwrite", (s) => s.put({ id: PLAN_ID, blob }));
}

export async function loadPlan(): Promise<SafetyPlan> {
  if (!key) throw new Error("locked");
  const row = await tx<{ id: string; blob: string } | undefined>("readonly", (s) => s.get(PLAN_ID));
  if (!row) return emptyPlan();
  try {
    return { ...emptyPlan(), ...JSON.parse(await open(key, row.blob)) };
  } catch {
    return emptyPlan();
  }
}

/** Wipes the vault and the PIN. For "forgot my PIN" and "delete everything". */
export async function wipe() {
  key = null;
  await new Promise<void>((res) => {
    const r = indexedDB.deleteDatabase(vaultDbName());
    r.onsuccess = r.onerror = r.onblocked = () => res();
  });
  updateProfile((p) => ({ vaultSalt: null, vaultCheck: null, checks: p.checks.map((c) => ({ ...c, saved: false })) }));
}
