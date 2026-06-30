import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "./i18n/useLanguage";
import ChecklistPage from "./pages/ChecklistPage";
import EventJoinPage from "./pages/EventJoinPage";
import BattleRecordPage from "./pages/BattleRecordPage";
import HallOfFamePage from "./pages/HallOfFamePage";
import HomePage from "./pages/HomePage";
import HostPage from "./pages/HostPage";
import ProfilePage from "./pages/ProfilePage";
import QuickStartGuidePage from "./pages/QuickStartGuidePage";
import RankingPage from "./pages/RankingPage";
import ResultCardPage from "./pages/ResultCardPage";
import StatsPage from "./pages/StatsPage";
import { registerServiceWorker } from "./utils/registerServiceWorker";
import "./styles.css";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/hall-of-fame" element={<HallOfFamePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/event/:slug" element={<EventJoinPage />} />
          <Route path="/event/:slug/checklist" element={<ChecklistPage />} />
          <Route path="/event/:slug/quick-start" element={<QuickStartGuidePage />} />
          <Route path="/event/:slug/ranking" element={<RankingPage />} />
          <Route path="/event/:slug/result" element={<ResultCardPage />} />
          <Route path="/event/:slug/battle-record" element={<BattleRecordPage />} />
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
