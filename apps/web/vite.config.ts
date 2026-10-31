import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.dirname(fileURLToPath(import.meta.url));

// ONNX Runtime's WebAssembly, served from ./ort/ (lite.ts sets wasmPaths there) so Ward Lite runs
// with the internet off; transformers.js would otherwise fetch it from a CDN. Taken from the
// onnxruntime-web that transformers.js itself depends on (pnpm keeps it beside it in the store),
// so the runtime always matches the library, and emitted by the build itself: a fresh clone or a
// CI runner gets it with no extra step. Vite's own hashed copy in assets/ is dropped, so the app
// and the APK don't carry it twice.
const ORT_FILES = ["ort-wasm-simd-threaded.asyncify.wasm", "ort-wasm-simd-threaded.asyncify.mjs"];
function ortDir() {
  const tf = realpathSync(path.join(web, "node_modules", "@huggingface", "transformers"));
  return path.join(realpathSync(path.join(tf, "..", "..", "onnxruntime-web")), "dist");
}

// What Ward Lite needs at runtime. The build fails if any of it is missing from the output, so a
// build without Ward Lite can never be shipped by accident (the app would quietly fall back to
// word lists alone).
const LITE_FILES = [
  ...ORT_FILES.map((f) => `ort/${f}`),
  "models/ward-lite/ward-lite.json",
  "models/ward-lite/config.json",
  "models/ward-lite/tokenizer.json",
  "models/ward-lite/tokenizer_config.json",
  "models/ward-lite/onnx/model_quantized.onnx",
];

const ortRuntime: Plugin = {
  name: "ward-ort-runtime",
  configureServer(server) {
    const dir = ortDir();
    server.middlewares.use("/ort", (req, res, next) => {
      const name = (req.url ?? "").split("?")[0]!.replace(/^\//, "");
      if (!ORT_FILES.includes(name)) return next();
      res.setHeader("Content-Type", name.endsWith(".wasm") ? "application/wasm" : "text/javascript");
      res.end(readFileSync(path.join(dir, name)));
    });
  },
  generateBundle(_, bundle) {
    // Every ONNX Runtime wasm the code refers to must be one this build ships in ./ort/.
    for (const [name, chunk] of Object.entries(bundle)) {
      if (!/ort-wasm.*\.wasm$/.test(name)) continue;
      const wanted = chunk.type === "asset" ? chunk.names : [];
      for (const w of wanted) if (!ORT_FILES.includes(w)) this.error(`ONNX Runtime wants ${w}, which isn't copied to ort/ (vite.config.ts ORT_FILES)`);
      delete bundle[name];
    }
    const dir = ortDir();
    for (const f of ORT_FILES) this.emitFile({ type: "asset", fileName: `ort/${f}`, source: readFileSync(path.join(dir, f)) });
  },
};

let outDir = path.join(web, "dist");
const liteCheck: Plugin = {
  name: "ward-lite-check",
  apply: "build",
  configResolved(config) {
    outDir = path.resolve(config.root, config.build.outDir);
  },
  closeBundle() {
    const missing = LITE_FILES.filter((f) => {
      const p = path.join(outDir, f);
      return !existsSync(p) || statSync(p).size === 0;
    });
    if (missing.length) throw new Error(`Ward Lite is incomplete in ${outDir}; missing: ${missing.join(", ")}`);
    const wasm = readFileSync(path.join(outDir, "ort", ORT_FILES[0]!));
    if (wasm.subarray(0, 4).toString("binary") !== "\0asm") throw new Error(`ort/${ORT_FILES[0]} isn't WebAssembly`);
  },
};

// The caseworker viewer (viewer/ward-viewer.html) ships beside the app as one self-contained
// file, so a helpline can open it from any Ward build: served in dev, emitted on build.
const viewerPath = new URL("../../viewer/ward-viewer.html", import.meta.url);
const caseworkerViewer: Plugin = {
  name: "ward-caseworker-viewer",
  configureServer(server) {
    server.middlewares.use("/ward-viewer.html", (_req, res) => {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(readFileSync(viewerPath));
    });
  },
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "ward-viewer.html", source: readFileSync(viewerPath) });
  },
};

// base "./" so the same build loads from Electron's ward:// origin and Capacitor's bundle.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), ortRuntime, liteCheck, caseworkerViewer],
  server: { port: 5199, strictPort: true },
});
