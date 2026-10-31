// Gemma 4 inside Ward for desktop: llama.cpp (through node-llama-cpp) in the main process, so a
// computer gets the close read without installing Ollama. The model isn't in the installer: the
// child or an adult chooses to download it, once, from Hugging Face. That download is the only
// network request Ward makes, and it carries nothing about the child. The renderer never sees a
// file path or a socket; it asks over IPC (preload.cjs) and gets text back.

import { createHash } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Gemma 4 E4B, instruction-tuned, Q4_0, converted by ggml-org (the llama.cpp maintainers). E4B is
 * the size Ward uses on computers through Ollama (86% of Roman Urdu abuse caught on the
 * scorecard; E2B judged poorly). Pinned to a commit and a SHA-256 so the file can't change
 * under us. Apache 2.0.
 */
export const MODEL = {
  name: "Gemma 4 E4B",
  file: "gemma-4-E4B-it-Q4_0.gguf",
  url: "https://huggingface.co/ggml-org/gemma-4-E4B-it-GGUF/resolve/a69f018d7678a2b9f5e705f8903d6fb29b9b25dc/gemma-4-E4B-it-Q4_0.gguf",
  bytes: 4_590_807_392,
  sha256: "a555b900214b477d8880e7832e0b8925e139b0159640036b09fe472b6f2097f2",
};

/** Weights plus an 8k context take about 6 GB; below 8 GB of memory the computer would crawl. */
const MIN_RAM = 7.5e9;
/** Unload after this long without a request, so Ward doesn't hold 5 GB while it sits open. */
const IDLE_MS = 10 * 60_000;

export function createGemma({ dir, fetch, onProgress = () => {}, log = () => {} }) {
  const file = path.join(dir, MODEL.file);
  const part = `${file}.part`;
  let download = null; // { controller, promise }
  let runtime = null; // Promise<{ llama } | { error }>
  let loaded = null; // Promise<{ model, context, session? }>
  let idle = null;
  let queue = Promise.resolve();

  const exists = (p) => fs.promises.stat(p).then((s) => s.size, () => 0);

  /** node-llama-cpp's prebuilt llama.cpp for this OS. Missing or broken binaries hide the feature. */
  function getRuntime() {
    runtime ??= (async () => {
      try {
        const { getLlama } = await import("node-llama-cpp");
        // Prebuilt binaries only: never compile on a child's computer. GPU if there is one
        // (Metal, Vulkan, CUDA), otherwise the CPU build.
        const llama = await getLlama({ gpu: "auto", build: "never", progressLogs: false, logLevel: "error" });
        log(`gemma: llama.cpp ready (${llama.gpu || "cpu"})`);
        return { llama };
      } catch (e) {
        log(`gemma: llama.cpp unavailable: ${e instanceof Error ? e.message : e}`);
        return { error: e instanceof Error ? e.message : String(e) };
      }
    })();
    return runtime;
  }

  async function status() {
    const rt = await getRuntime();
    let freeBytes = 0;
    try {
      await fsp.mkdir(dir, { recursive: true });
      const s = await fsp.statfs(dir);
      freeBytes = s.bavail * s.bsize;
    } catch {}
    return {
      available: !!rt.llama,
      runtimeError: rt.error ?? null,
      gpu: rt.llama ? rt.llama.gpu || null : null,
      ramBytes: os.totalmem(),
      supported: os.totalmem() >= MIN_RAM,
      name: MODEL.name,
      modelBytes: MODEL.bytes,
      downloaded: (await exists(file)) === MODEL.bytes,
      partialBytes: await exists(part),
      freeBytes,
      downloading: !!download,
      loaded: !!loaded,
    };
  }

  /** Resumes a partial download, retries dropped connections, and checks the hash before keeping it. */
  function startDownload() {
    if (download) return download.promise;
    const controller = new AbortController();
    const promise = (async () => {
      await fsp.mkdir(dir, { recursive: true });
      if ((await exists(file)) === MODEL.bytes) return;
      for (let attempt = 0; ; attempt++) {
        try {
          await fetchRange(controller.signal);
          break;
        } catch (e) {
          if (controller.signal.aborted) throw new Error("cancelled");
          if (e?.code === "HASH" || attempt >= 4) throw e;
          log(`gemma: download interrupted (${e instanceof Error ? e.message : e}), retrying`);
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
      }
      // The hash covers the whole file, including what earlier sessions downloaded.
      onProgress({ loaded: MODEL.bytes, total: MODEL.bytes, verifying: true });
      const hash = createHash("sha256");
      for await (const chunk of fs.createReadStream(part, { highWaterMark: 4 << 20 })) {
        if (controller.signal.aborted) throw new Error("cancelled");
        hash.update(chunk);
      }
      const got = hash.digest("hex");
      if (got !== MODEL.sha256) {
        await fsp.rm(part, { force: true });
        const err = new Error("The download was damaged, so Ward deleted it. Try again.");
        err.code = "HASH";
        throw err;
      }
      await fsp.rename(part, file);
      log("gemma: model downloaded and verified");
    })().finally(() => {
      download = null;
    });
    download = { controller, promise };
    return promise;
  }

  async function fetchRange(signal) {
    const have = await exists(part);
    if (have > MODEL.bytes) await fsp.rm(part, { force: true });
    const from = have > MODEL.bytes ? 0 : have;
    if (from === MODEL.bytes) return;
    // No cookies, no referrer, nothing about the child: a plain GET for one public file.
    const r = await fetch(MODEL.url, { headers: from ? { range: `bytes=${from}-` } : {}, signal, credentials: "omit", cache: "no-store" });
    if (!r.ok || !r.body) throw new Error(`Download failed (${r.status})`);
    const resumed = r.status === 206;
    const out = fs.createWriteStream(part, { flags: resumed ? "a" : "w" });
    let loaded = resumed ? from : 0;
    let last = 0;
    try {
      for await (const chunk of r.body) {
        if (!out.write(chunk)) await new Promise((res) => out.once("drain", res));
        loaded += chunk.length;
        if (Date.now() - last > 250) {
          last = Date.now();
          onProgress({ loaded, total: MODEL.bytes });
        }
      }
    } finally {
      await new Promise((res) => out.end(res));
    }
    onProgress({ loaded, total: MODEL.bytes });
    if (loaded !== MODEL.bytes) throw new Error("The connection dropped");
  }

  function cancel() {
    download?.controller.abort();
  }

  async function remove() {
    cancel();
    await unload();
    await fsp.rm(file, { force: true });
    await fsp.rm(part, { force: true });
  }

  async function load() {
    loaded ??= (async () => {
      const { llama, error } = await getRuntime();
      if (!llama) throw new Error(error);
      if ((await exists(file)) !== MODEL.bytes) throw new Error("Gemma isn't downloaded");
      const started = Date.now();
      const model = await llama.loadModel({ modelPath: file });
      // 8k tokens, like Ollama's num_ctx in GemmaJudge: a 16-message batch plus context fits.
      const context = await model.createContext({ contextSize: 8192 });
      log(`gemma: loaded in ${Date.now() - started} ms (${llama.gpu || "cpu"})`);
      return { llama, model, context, sequence: context.getSequence() };
    })();
    try {
      return await loaded;
    } catch (e) {
      loaded = null;
      throw e;
    }
  }

  async function unload() {
    const l = loaded;
    loaded = null;
    if (!l) return;
    try {
      const { model, context } = await l;
      await context.dispose();
      await model.dispose();
    } catch {}
  }

  /** One request at a time, each in a fresh chat: nothing from one chat is kept for the next. */
  function generate({ system, prompt, schema, temperature = 0, maxTokens = 2048 }) {
    const run = async () => {
      clearTimeout(idle);
      const { llama, sequence } = await load();
      const { LlamaChatSession, Gemma4ChatWrapper } = await import("node-llama-cpp");
      await sequence.clearHistory();
      // No thinking, the same as `think: false` for Ollama: quicker, and the schema does the work.
      const chatWrapper = new Gemma4ChatWrapper({ reasoning: false });
      const session = new LlamaChatSession({ contextSequence: sequence, chatWrapper, systemPrompt: system || undefined, autoDisposeSequence: false });
      try {
        let grammar;
        if (schema) {
          try {
            grammar = await llama.createGrammarForJsonSchema(toGbnfSchema(schema));
          } catch (e) {
            log(`gemma: schema not supported, free text instead (${e instanceof Error ? e.message : e})`);
          }
        }
        return await session.prompt(prompt, { grammar, temperature, maxTokens, budgets: { thoughtTokens: 0 } });
      } finally {
        session.dispose({ disposeSequence: false });
        idle = setTimeout(() => void unload(), IDLE_MS);
        idle.unref?.();
      }
    };
    const p = queue.then(run, run);
    queue = p.catch(() => {});
    return p;
  }

  return { status, startDownload, cancel, remove, generate, unload, getRuntime, file };
}

/** Ollama's JSON-schema dialect to node-llama-cpp's: an enum is its own schema, without a type. */
function toGbnfSchema(s) {
  if (Array.isArray(s)) return s.map(toGbnfSchema);
  if (!s || typeof s !== "object") return s;
  const out = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === "type" && "enum" in s) continue;
    out[k] = k === "properties" ? Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, toGbnfSchema(pv)])) : toGbnfSchema(v);
  }
  return out;
}
