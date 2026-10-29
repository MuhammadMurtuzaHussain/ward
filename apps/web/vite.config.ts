import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";

// ONNX Runtime's WebAssembly is served from ./ort/ (scripts/copy-ort.mjs); drop the second copy
// Vite would otherwise emit into assets/, so the app and the APK don't carry it twice.
const noDuplicateOrt: Plugin = {
  name: "ward-no-duplicate-ort",
  generateBundle(_, bundle) {
    for (const name of Object.keys(bundle)) if (/ort-wasm.*\.wasm$/.test(name)) delete bundle[name];
  },
};

// base "./" so the same build loads from Electron's ward:// origin and Capacitor's bundle.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), noDuplicateOrt],
  server: { port: 5199, strictPort: true },
});
