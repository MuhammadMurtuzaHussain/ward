import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App.tsx";
import { listenForShares } from "./lib/shareIn.ts";
import { listenForQuickExitKey } from "./lib/privacy.ts";

listenForShares();
listenForQuickExitKey();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
