// The evidence vault. Saved chats are encrypted with AES-GCM under a key derived from the
// child's PIN (PBKDF2, 310k rounds) and kept in IndexedDB on this device. The PIN is never
// stored; a small encrypted marker lets Ward check it. Each saved message also gets a SHA-256
// fingerprint, so a printed report can show the evidence wasn't edited after saving.

import type { Analysis, Chat } from "@ward/engine";
import { getState, updateProfile } from "./store.ts";

const DB = "ward-vault";
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
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((res, rej) => {
        const req = fn(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      }),
  );
}

async function sha256(s: string) {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function fingerprint(chat: Chat) {
  return Promise.all(chat.messages.map((m) => sha256(`${m.sender}|${m.at?.toISOString() ?? ""}|${m.text}`)));
}

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

/** Wipes the vault and the PIN. For "forgot my PIN" and "delete everything". */
export async function wipe() {
  key = null;
  await new Promise<void>((res) => {
    const r = indexedDB.deleteDatabase(DB);
    r.onsuccess = r.onerror = r.onblocked = () => res();
  });
  updateProfile((p) => ({ vaultSalt: null, vaultCheck: null, checks: p.checks.map((c) => ({ ...c, saved: false })) }));
}
