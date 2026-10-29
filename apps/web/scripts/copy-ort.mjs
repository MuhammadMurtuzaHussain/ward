// ONNX Runtime's WebAssembly files, copied into the bundle so Ward Lite runs with the internet off
// (transformers.js would otherwise fetch them from a CDN).
import { copyFileSync, mkdirSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";

// pnpm keeps each package's own dependencies beside it in the store.
const web = path.join(import.meta.dirname, "..");
const tf = realpathSync(path.join(web, "node_modules", "@huggingface", "transformers"));
const ort = path.join(realpathSync(path.join(tf, "..", "..", "onnxruntime-web")), "dist");
const out = path.join(import.meta.dirname, "..", "public", "ort");
mkdirSync(out, { recursive: true });
for (const f of readdirSync(ort).filter((f) => /^ort-wasm-simd-threaded(\.jsep)?\.(wasm|mjs)$/.test(f))) copyFileSync(path.join(ort, f), path.join(out, f));
console.log("ort ->", out);
