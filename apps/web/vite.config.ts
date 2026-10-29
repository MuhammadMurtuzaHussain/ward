import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base "./" so the same build loads from Electron's ward:// origin and Capacitor's bundle.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { port: 5199, strictPort: true },
});
