// The hosted web demo (GitHub Pages) is built with VITE_WARD_DEMO=1. It runs word lists and Ward
// Lite in the browser and nothing else: no Ollama on the visitor's computer, no share sheet.
export const DEMO = import.meta.env.VITE_WARD_DEMO === "1";
