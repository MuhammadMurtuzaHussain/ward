import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App.tsx";
import { LabBanner } from "./components/LabMode.tsx";
import { DemoBanner } from "./demo/DemoBanner.tsx";
import { listenForShares } from "./lib/shareIn.ts";
import { listenForQuickExitKey } from "./lib/privacy.ts";
import { listenForAppLife } from "./lib/appLife.ts";

listenForShares();
listenForQuickExitKey();
listenForAppLife();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DemoBanner />
    <LabBanner />
    <App />
  </StrictMode>,
);
