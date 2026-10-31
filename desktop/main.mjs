// Ward for desktop: the same app, served from the bundle at app://ward so it works with the
// internet off. app:// is one of Ollama's default allowed origins, so the window can talk to
// Gemma on 127.0.0.1:11434 directly. Without Ollama, Gemma 4 runs inside Ward (gemma.mjs) once
// it has been downloaded; that download is the only thing Ward ever fetches from the network.
import { app, BrowserWindow, ipcMain, net, protocol, session, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createGemma } from "./gemma.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB = app.isPackaged ? path.join(process.resourcesPath, "web") : path.join(here, "..", "apps", "web", "dist");
// WARD_SMOKE=1 launches, checks a screen comes up and Ward Lite opens, and quits. WARD_SMOKE=llama
// also requires the bundled llama.cpp to load on this platform.
const SMOKE = process.env.WARD_SMOKE ?? "";
// Run in the page by the smoke test: start ort/'s runtime, create a session from the Ward Lite
// model and count its inputs and outputs. Resolves to "ok ..." or throws.
const LITE_SMOKE = `(async () => {
  const base = new URL("./", document.baseURI).href;
  const { default: factory } = await import(base + "ort/ort-wasm-simd-threaded.asyncify.mjs");
  const ort = await factory({ numThreads: 1, locateFile: (f) => base + "ort/" + f });
  if (ort._OrtInit(1, 3) !== 0) throw new Error("the runtime didn't start");
  ort.asyncInit?.();
  const res = await fetch(base + "models/ward-lite/onnx/model_quantized.onnx");
  if (!res.ok) throw new Error("the model isn't in this build");
  const bytes = new Uint8Array(await res.arrayBuffer());
  const options = ort._OrtCreateSessionOptions(99, 0, 0, 0, 0, 0, 0, 3, 0, 0);
  const at = ort._malloc(bytes.length);
  ort.HEAPU8.set(bytes, at);
  const session = await ort._OrtCreateSession(at, bytes.length, options);
  ort._free(at);
  if (!session) throw new Error("the model didn't open");
  const counts = ort._malloc(8);
  ort._OrtGetInputOutputCount(session, counts, counts + 4);
  const [inputs, outputs] = [ort.getValue(counts, "i32"), ort.getValue(counts + 4, "i32")];
  ort._free(counts);
  ort._OrtReleaseSession(session);
  if (inputs < 2 || outputs !== 1) throw new Error(inputs + " inputs, " + outputs + " outputs");
  return "ok (" + (bytes.length / 1e6).toFixed(1) + " MB model, " + inputs + " inputs)";
})()`;

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

// Lab mode, for shared school computers: Ward keeps nothing between sessions. The page's storage
// is wiped when Ward opens and when it closes. On with `--lab`, or from Me > Lab mode (remembered
// in a one-line file outside the page's storage). The downloaded model stays.
const LAB_FILE = path.join(app.getPath("userData"), "lab-mode.json");
const LAB_FLAG = process.argv.includes("--lab") || app.commandLine.hasSwitch("lab");
let labSetting = false;
try {
  labSetting = JSON.parse(fs.readFileSync(LAB_FILE, "utf8")).on === true;
} catch {}
const labOn = () => LAB_FLAG || labSetting;

async function wipeStorage() {
  const s = session.defaultSession;
  await s.clearStorageData();
  await s.clearCache();
  await s.clearCodeCaches({});
}

const gemma = createGemma({
  dir: path.join(app.getPath("userData"), "models"),
  // Electron's network stack, so a school's proxy settings apply. Only the model URL is fetched.
  fetch: (url, init) => net.fetch(url, init),
  onProgress: (p) => BrowserWindow.getAllWindows().forEach((w) => w.webContents.send("gemma:progress", p)),
  log: (m) => console.log(m),
});

/** Only Ward's own page may use the bridge. */
const fromWard = (e) => (e.senderFrame?.url ?? "").startsWith("app://ward/");
function handle(channel, fn) {
  ipcMain.handle(channel, (e, ...args) => {
    if (!fromWard(e)) throw new Error("not allowed");
    return fn(...args);
  });
}

const clamp = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : d);
handle("gemma:status", () => gemma.status());
handle("gemma:download", () => gemma.startDownload());
handle("gemma:cancel", () => gemma.cancel());
handle("gemma:remove", () => gemma.remove());
handle("gemma:generate", (o) => {
  if (!o || typeof o !== "object" || typeof o.prompt !== "string") throw new Error("bad request");
  return gemma.generate({
    system: typeof o.system === "string" ? o.system.slice(0, 20_000) : "",
    prompt: o.prompt.slice(0, 60_000),
    schema: o.schema && typeof o.schema === "object" ? o.schema : undefined,
    temperature: clamp(o.temperature, 0, 1, 0),
    maxTokens: clamp(o.maxTokens, 16, 4096, 2048),
  });
});
handle("lab:status", () => ({ on: labOn(), flag: LAB_FLAG }));
handle("lab:set", (on) => {
  labSetting = on === true;
  fs.mkdirSync(path.dirname(LAB_FILE), { recursive: true });
  fs.writeFileSync(LAB_FILE, JSON.stringify({ on: labSetting }));
  return { on: labOn(), flag: LAB_FLAG };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 380,
    minHeight: 600,
    title: "Ward",
    backgroundColor: "#0f1024",
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false, preload: path.join(here, "preload.cjs") },
  });
  win.once("ready-to-show", () => win.show());
  // Links (helplines, Take It Down) open in the real browser; the app never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    // about:blank is the printable evidence report.
    return url === "about:blank" ? { action: "allow" } : { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("app://ward/")) e.preventDefault();
  });
  win.loadURL("app://ward/index.html");
  if (SMOKE) {
    win.webContents.once("did-finish-load", async () => {
      // React renders after load; give it up to 10 s to put a screen up. Any first screen counts
      // (a fresh install opens on the language picker, which doesn't say "Ward").
      let ok = false;
      for (let i = 0; i < 50 && !ok; i++) {
        ok = await win.webContents.executeJavaScript("!!document.querySelector('#root main') && document.body.innerText.trim().length > 20");
        if (!ok) await new Promise((r) => setTimeout(r, 200));
      }
      console.log(ok ? "smoke: ok" : "smoke: page loaded without Ward");
      // The bridge reaches the page, and llama.cpp loads here (or the feature hides itself).
      const bridge = await win.webContents.executeJavaScript("typeof window.wardDesktop?.gemma?.status");
      const rt = await gemma.getRuntime();
      console.log(`smoke: bridge ${bridge}, llama.cpp ${rt.llama ? `ok (${rt.llama.gpu || "cpu"})` : `unavailable: ${rt.error}`}, lab mode ${labOn() ? "on" : "off"}`);
      if (SMOKE === "llama" && !(rt.llama && bridge === "function")) ok = false;
      // Ward Lite: the ONNX Runtime the build ships in ort/ starts in this sandboxed page and opens
      // the bundled model, the way lite.ts does. (Its raw API, so a runtime update may need this
      // changed too; a failure here means Ward Lite can't read on this platform.)
      const lite = await Promise.race([
        win.webContents.executeJavaScript(LITE_SMOKE),
        new Promise((_, no) => setTimeout(() => no(new Error("timed out")), 60_000)),
      ]).catch((e) => `failed: ${e?.message ?? e}`);
      console.log(`smoke: Ward Lite ${lite}`);
      if (!lite.startsWith("ok")) ok = false;
      app.exit(ok ? 0 : 1);
    });
    win.webContents.once("did-fail-load", () => app.exit(1));
  }
}

app.whenReady().then(async () => {
  // Only the camera, and only for counsellor mode's QR scanner (the page asks for video, never
  // audio). Every other permission (location, notifications, microphone…) is refused.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, done, details) => {
    done(permission === "media" && !(details.mediaTypes ?? []).includes("audio"));
  });
  protocol.handle("app", (req) => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(WEB, decodeURIComponent(pathname)));
    if (!file.startsWith(WEB)) return new Response("not found", { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  // Lab mode: start clean, in case the last session didn't get to close properly.
  if (labOn()) await wipeStorage().catch(() => {});
  createWindow();
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

// In lab mode closing the window ends the session, on a Mac too.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || labOn()) app.quit();
});

let wiped = false;
app.on("before-quit", (e) => {
  gemma.cancel();
  if (!labOn() || wiped) return;
  e.preventDefault();
  wiped = true;
  wipeStorage()
    .catch(() => {})
    .finally(() => app.quit());
});
