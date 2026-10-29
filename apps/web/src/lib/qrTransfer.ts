// Handing a report from a child's phone to a counsellor's with QR codes, no network at all.
// A report (5 to 20 KB) is too big for one code, so it's compressed, split into small numbered
// frames, and shown as a loop of codes; the counsellor's camera collects frames in any order
// until it has them all. Frame text: WARD1|<session>|<index>|<count>|<mode>|<data>, where mode
// is "d" (deflate-raw, base64url) or "j" (plain JSON, base64url) where compression isn't there.

const MAGIC = "WARD1";
/** Characters of data per frame: small enough for a phone camera to read off another screen. */
export const FRAME_CHARS = 480;

const b64url = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export async function encodeFrames(json: string, chars = FRAME_CHARS): Promise<string[]> {
  const raw = new TextEncoder().encode(json);
  const canZip = typeof CompressionStream !== "undefined";
  const data = b64url(canZip ? await pipe(raw, new CompressionStream("deflate-raw")) : raw);
  const session = Math.random().toString(36).slice(2, 8);
  const n = Math.max(1, Math.ceil(data.length / chars));
  return Array.from({ length: n }, (_, i) => `${MAGIC}|${session}|${i}|${n}|${canZip ? "d" : "j"}|${data.slice(i * chars, (i + 1) * chars)}`);
}

/** Collects frames from the camera, in any order, and rebuilds the text once all have arrived. */
export class FrameCollector {
  session: string | null = null;
  count = 0;
  mode = "j";
  parts = new Map<number, string>();

  /** Returns true if this frame was new. Frames from a different session restart the collection. */
  accept(text: string): boolean {
    const m = /^WARD1\|([a-z0-9]+)\|(\d+)\|(\d+)\|([dj])\|([A-Za-z0-9_-]*)$/.exec(text);
    if (!m) return false;
    const [, session, i, n, mode, data] = m;
    if (session !== this.session) {
      this.session = session!;
      this.count = Number(n);
      this.mode = mode!;
      this.parts.clear();
    }
    if (this.parts.has(Number(i))) return false;
    this.parts.set(Number(i), data!);
    return true;
  }

  get done() {
    return this.count > 0 && this.parts.size === this.count;
  }

  async text(): Promise<string> {
    const data = Array.from({ length: this.count }, (_, i) => this.parts.get(i) ?? "").join("");
    const bytes = unb64url(data);
    return new TextDecoder().decode(this.mode === "d" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes);
  }
}
