import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./i18n/useLanguage";
import ChecklistPage from "./pages/ChecklistPage";
import EventJoinPage from "./pages/EventJoinPage";
import HostPage from "./pages/HostPage";
import QuickStartGuidePage from "./pages/QuickStartGuidePage";
import RankingPage from "./pages/RankingPage";
import ResultCardPage from "./pages/ResultCardPage";
import { registerServiceWorker } from "./utils/registerServiceWorker";
import "./styles.css";

function EmptyRoute() {
  const { t } = useLanguage();

  return (
    <main className="app-shell centered-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">{t("app.name")}</p>
        <h1>{t("route.emptyTitle")}</h1>
        <p className="muted">{t("route.emptyBody")}</p>
      </section>
    </main>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EmptyRoute />} />
          <Route path="/event/:slug" element={<EventJoinPage />} />
          <Route path="/event/:slug/checklist" element={<ChecklistPage />} />
          <Route path="/event/:slug/quick-start" element={<QuickStartGuidePage />} />
          <Route path="/event/:slug/ranking" element={<RankingPage />} />
          <Route path="/event/:slug/result" element={<ResultCardPage />} />
          <Route path="/event/:slug/host" element={<HostPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerServiceWorker();
