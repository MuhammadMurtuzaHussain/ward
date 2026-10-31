// The whole bridge between Ward's page and the desktop app: a handful of calls over IPC, nothing
// else. The page stays sandboxed (contextIsolation on, no Node): it can ask Gemma to read a prompt
// and get text back, download or remove the model, and turn lab mode on or off. It never gets a
// file path, a socket or a port.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("wardDesktop", {
  gemma: {
    status: () => ipcRenderer.invoke("gemma:status"),
    download: () => ipcRenderer.invoke("gemma:download"),
    cancel: () => ipcRenderer.invoke("gemma:cancel"),
    remove: () => ipcRenderer.invoke("gemma:remove"),
    generate: (o) => ipcRenderer.invoke("gemma:generate", o),
    onProgress: (fn) => {
      const h = (_e, p) => fn(p);
      ipcRenderer.on("gemma:progress", h);
      return () => ipcRenderer.removeListener("gemma:progress", h);
    },
  },
  lab: {
    status: () => ipcRenderer.invoke("lab:status"),
    set: (on) => ipcRenderer.invoke("lab:set", on),
  },
});
