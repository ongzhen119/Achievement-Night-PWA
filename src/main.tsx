import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "./i18n/useLanguage";
import BattleRecordsPage from "./pages/BattleRecordsPage";
import CardHelpPage from "./pages/CardHelpPage";
import CommunityBoardPage from "./pages/CommunityBoardPage";
import HomePage from "./pages/HomePage";
import HostCardHelpPage from "./pages/HostCardHelpPage";
import HostEventBoardPage from "./pages/HostEventBoardPage";
import LogBattlePage from "./pages/LogBattlePage";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import PlayersPage from "./pages/PlayersPage";
import QuickStartGuidePage from "./pages/QuickStartGuidePage";
import { registerServiceWorker } from "./utils/registerServiceWorker";
import "./styles.css";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/battles/new" element={<LogBattlePage />} />
          <Route path="/battles" element={<BattleRecordsPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:playerId" element={<PlayerProfilePage />} />
          <Route path="/community" element={<CommunityBoardPage />} />
          <Route path="/host" element={<HostEventBoardPage />} />
          <Route path="/host/card-help" element={<HostCardHelpPage />} />
          <Route path="/card-help" element={<CardHelpPage />} />
          <Route path="/guide" element={<QuickStartGuidePage />} />
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
