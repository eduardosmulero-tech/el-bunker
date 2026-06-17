// ============================================================
//  EL BÚNKER — TabShell.jsx (S116-L2)
//  Shell autenticado: tab router + DropAlertModal + Layout
// ============================================================
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useVault } from "../core/VaultContext";
import { usePlayer } from "../core/PlayerContext";
import Layout from "./Layout";
import { DropAlertModal } from "../musiclab/DropsManager";
import { FONT_MONO as FONT } from "../tokens";
import { VaultPage, MusicPage, CapsulesPage } from "./PageWrappers";

// ─── TAB ROUTER ──────────────────────────────────────────────
const TAB_MAP = { vault: VaultPage, music: MusicPage, capsules: CapsulesPage };

// S101 — Orden de tabs para slide direccional: vault(0) → music(1) → capsules(2)
const TAB_ORDER = { vault: 0, music: 1, capsules: 2 };

// ─── AUTHENTICATED APP ───────────────────────────────────────
export const AuthenticatedApp = () => {
  const {
      user: _user, db, dbStatus, lastHeartbeat,
      activeTab, setActiveTab,
      masterVolume: _masterVolume,
      logout,
      pendingDrop, clearPendingDrop,
    } = useVault();
  const { playTrack } = usePlayer();

  const ActivePage = TAB_MAP[activeTab] ?? VaultPage;

  // S101 — Trackear tab anterior para slide direccional
  const { current: prevTab } = useRef({ prev: activeTab });
  useEffect(() => { prevTab.prev = activeTab; }, [activeTab, prevTab]);

  // S101 — Dirección del slide
  const direction = (TAB_ORDER[activeTab] ?? 0) >= (TAB_ORDER[prevTab.prev] ?? 0) ? 1 : -1;

  const slideVariants = {
    initial: { opacity: 0, x: 24 * direction },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -24 * direction },
  };

  const handleDropPlay = (track) => {
    if (track) playTrack(track);
    clearPendingDrop(pendingDrop?.id);
    setActiveTab("music");
  };

  const handleDropDismiss = () => {
    clearPendingDrop(pendingDrop?.id);
  };

  return (
    <>
      <DropAlertModal
        drop={pendingDrop}
        tracks={db?.music_lab?.tracks ?? []}
        onPlay={handleDropPlay}
        onDismiss={handleDropDismiss}
      />
      <Layout
          isAuthenticated
          dbStatus={dbStatus}
          lastHeartbeat={lastHeartbeat}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSignOut={logout}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={slideVariants.initial}
            animate={slideVariants.animate}
            exit={slideVariants.exit}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <ActivePage />
          </motion.div>
        </AnimatePresence>
      </Layout>
    </>
  );
};

// ─── UNAUTHORIZED SCREEN ────────────────────────────────────
export const UnauthorizedScreen = ({ userEmail }) => (
  <div
    className="fixed inset-0 flex flex-col items-center justify-center z-[300] px-6 text-center"
    style={{ background: "#0a0000", fontFamily: FONT }}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-8 border-2 border-[#ff3b3b] bg-[#1a0000] relative"
      style={{ boxShadow: "0 0 30px rgba(255, 59, 59, 0.2)" }}
    >
      <h1 className="text-3xl font-black mb-4 tracking-tighter" style={{ color: "#ff3b3b" }}>
        [!] ACCESO NO AUTORIZADO
      </h1>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: "#ff8080" }}>
        La identidad <span className="underline">{userEmail}</span> no tiene privilegios
        de lectura en este búnker. Los protocolos de seguridad han sido activados.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 text-xs font-bold tracking-[0.3em] uppercase transition-all min-h-[44px]"
        style={{ border: "1px solid #ff3b3b", color: "#ff3b3b" }}
      >
        REINTENTAR IDENTIFICACIÓN
      </button>
    </motion.div>
  </div>
);
