// Ward for desktop: the same app, served from the bundle at app://ward so it works with the
// internet off. app:// is one of Ollama's default allowed origins, so the window can talk to
// Gemma on 127.0.0.1:11434 directly. Nothing else is loaded from the network.
import { app, BrowserWindow, net, protocol, shell } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB = app.isPackaged ? path.join(process.resourcesPath, "web") : path.join(here, "..", "apps", "web", "dist");
const SMOKE = Boolean(process.env.WARD_SMOKE);

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

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
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false },
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
      const ok = await win.webContents.executeJavaScript("document.body.innerText.includes('Ward')");
      console.log(ok ? "smoke: ok" : "smoke: page loaded without Ward");
      app.exit(ok ? 0 : 1);
    });
    win.webContents.once("did-fail-load", () => app.exit(1));
  }
}

app.whenReady().then(() => {
  protocol.handle("app", (req) => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(WEB, decodeURIComponent(pathname)));
    if (!file.startsWith(WEB)) return new Response("not found", { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
