// The vault's sealing, kept apart from IndexedDB and the store so it can be tested on its own.
// A sealed value is "<iv base64>.<ciphertext base64>": AES-GCM under a key from the PIN.
// Every row saved so far uses this format, so changing it would lock children out of evidence
// they already saved. Only the encoder changed: it now builds the string in chunks, because
// spreading a whole long chat into String.fromCharCode throws past about 120 KB.

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Same output as btoa(String.fromCharCode(...bytes)), for any size. */
export const b64 = (b: ArrayBuffer | Uint8Array) => {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

export const unb64 = (s: string): Uint8Array<ArrayBuffer> => {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export async function derive(pin: string, salt: Uint8Array<ArrayBuffer>) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 310_000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function seal(k: CryptoKey, data: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, enc.encode(data));
  return `${b64(iv)}.${b64(ct)}`;
}

export async function open(k: CryptoKey, sealed: string) {
  const [iv, ct] = sealed.split(".");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv!) }, k, unb64(ct!));
  return dec.decode(pt);
}
