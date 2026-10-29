import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { readFileSync } from "node:fs";

// ONNX Runtime's WebAssembly is served from ./ort/ (scripts/copy-ort.mjs); drop the second copy
// Vite would otherwise emit into assets/, so the app and the APK don't carry it twice.
const noDuplicateOrt: Plugin = {
  name: "ward-no-duplicate-ort",
  generateBundle(_, bundle) {
    for (const name of Object.keys(bundle)) if (/ort-wasm.*\.wasm$/.test(name)) delete bundle[name];
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
  plugins: [react(), tailwindcss(), noDuplicateOrt, caseworkerViewer],
  server: { port: 5199, strictPort: true },
});
