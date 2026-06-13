// ============================================================
//  EL BÚNKER — App.jsx
//  Orquestador Principal · Router · State Orchestration
//  Stack: React 18 + Framer Motion
// ============================================================
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { VaultProvider, useVault } from "../core/VaultContext";
import { useMusicActions }               from "../musiclab/useMusicActions";
import { PlayerProvider, usePlayer }     from "../core/PlayerContext";
import Layout                            from "./Layout";
import LoginScreen                       from "./LoginScreen";
import Vault                             from "../vault/Vault";
import MusicLab                          from "../musiclab/MusicLab";
import { DropAlertModal }               from "../musiclab/DropsManager";
import Capsules                          from "../capsules/Capsules";
// ─── DESIGN TOKENS (mirrored for this file) ──────────────────
const ACID   = "#bfff00";
const BG     = "#050505";
const FONT   = "'JetBrains Mono', 'Courier New', monospace";

// ─── GLOBAL LOADING SCREEN ───────────────────────────────────
/**
 * Shown during INIT_SERVICES and INIT_DB boot phases.
 * The heartbeat pulses faster when syncing DB.
 */
const GlobalLoadingScreen = ({ phase }) => {
  const isSyncing = phase === "init_db";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[200]"
      style={{ background: BG, fontFamily: FONT }}
    >
      {/* Scanlines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Heartbeat that SYNCS with data load state */}
      <motion.div
        animate={{
          scale:  isSyncing ? [1, 1.4, 1, 1.3, 1] : [1, 1.18, 1],
          filter: isSyncing
            ? [`drop-shadow(0 0 4px ${ACID}44)`, `drop-shadow(0 0 24px ${ACID})`, `drop-shadow(0 0 4px ${ACID}44)`]
            : [`drop-shadow(0 0 4px ${ACID}44)`, `drop-shadow(0 0 12px ${ACID})`, `drop-shadow(0 0 4px ${ACID}44)`],
        }}
        transition={{
          duration: isSyncing ? 0.6 : 1.8,
          repeat: Infinity,
          ease: isSyncing ? "easeInOut" : "easeOut",
          times: isSyncing ? [0, 0.25, 0.45, 0.65, 1] : [0, 0.3, 1],
        }}
        className="mb-8"
      >
        <svg width="48" height="44" viewBox="0 0 36 32" fill="none">
          <path
            d="M18 30C18 30 2 20 2 10C2 5.58172 5.58172 2 10 2C13.1379 2 15.8938 3.73517 17.4 6.30556C17.5882 6.62685 17.7657 6.92685 18 7.20556C18.2343 6.92685 18.4118 6.62685 18.6 6.30556C20.1062 3.73517 22.8621 2 26 2C30.4183 2 34 5.58172 34 10C34 20 18 30 18 30Z"
            fill={ACID}
            opacity="0.9"
          />
        </svg>
      </motion.div>

      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="text-xs tracking-[0.4em] uppercase"
        style={{ color: ACID, textShadow: `0 0 12px ${ACID}` }}
      >
        {phase === "init_services" ? "CARGANDO SERVICIOS..." : "SINCRONIZANDO VAULT..."}
      </motion.p>

      {/* Progress bar */}
      <div
        className="mt-6 w-48 h-px overflow-hidden"
        style={{ background: `${ACID}22` }}
      >
        <motion.div
          className="h-full"
          style={{ background: ACID, boxShadow: `0 0 8px ${ACID}` }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

// ─── BOOT ERROR SCREEN ───────────────────────────────────────
const ErrorScreen = ({ message, onRetry }) => (
  <div
    className="fixed inset-0 flex flex-col items-center justify-center z-[200] px-8"
    style={{ background: BG, fontFamily: FONT }}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-6 text-center max-w-sm"
    >
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="text-4xl"
      >
        ⚠
      </motion.p>
      <p className="text-xs tracking-[0.4em] uppercase" style={{ color: "#ff3b3b", textShadow: "0 0 12px #ff3b3b" }}>
        ERROR DE SISTEMA
      </p>
      <p className="text-xs leading-relaxed opacity-60" style={{ color: ACID }}>
        {message ?? "No se pudo conectar al Búnker."}
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="text-xs tracking-[0.3em] uppercase px-6 py-3"
        style={{
          color: ACID,
          border: `1px solid ${ACID}44`,
          background: `${ACID}08`,
          fontFamily: FONT,
        }}
      >
        REINTENTAR →
      </motion.button>
    </motion.div>
  </div>
);

// ─── PAGE COMPONENTS ─────────────────────────────────────────

/** Wrapper para la pestaña VAULT */
const VaultPage = () => {
  const { db, jwtToken } = useVault();
  return (
    <Vault
      db={db}
      jwtToken={jwtToken}
      onAddEra={async () => {
        // Could open a modal; placeholder for now
        console.log("[App] onAddEra triggered");
      }}
      onOpenEra={(era) => {
        console.log("[App] Opening era:", era.name);
      }}
    />
  );
};

/** Wrapper para la pestaña MUSIC LAB */
const MusicPage = () => {
  const { db, user, setMasterVolume, patchDb, jwtToken } = useVault();
  const { onAddTrack, onDeleteTrack, onEditTrack, onAddDrop, onMarkDropSeen } = useMusicActions();

  const handleAddTag = async (tagData) => {
    const newTag = {
      ...tagData,
      id: crypto.randomUUID(),
      created_by: user?.id ?? "user",
      created_at: new Date().toISOString(),
    };
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tags: [...(prev.music_lab?.tags ?? []), newTag],
      },
    }));
  };

  const handleUpdateTag = async (tagId, updates) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tags: (prev.music_lab?.tags ?? []).map((t) =>
          t.id === tagId ? { ...t, ...updates } : t
        ),
      },
    }));
  };

  const handleDeleteTag = async (tagId) => {
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tags: (prev.music_lab?.tags ?? []).filter((t) => t.id !== tagId),
      },
    }));
  };

  return (
    <MusicLab
      db={db}
      userId={user?.id ?? null}
      jwtToken={jwtToken}
      onAddTrack={onAddTrack}
      onAddDrop={onAddDrop}
      onDeleteTrack={onDeleteTrack}
      onEditTrack={onEditTrack}
      onMasterVolumeChange={setMasterVolume}
      onMarkDropSeen={onMarkDropSeen}
      patchDb={patchDb}
      onAddTag={handleAddTag}
      onUpdateTag={handleUpdateTag}
      onDeleteTag={handleDeleteTag}
    />
  );
};

// Placeholder eliminado — Timeline fusionada en CAPSULES (ADR-017, ADR-020)

/** Wrapper para CAPSULES con SmokeSession flotante */
const CapsulesPage = () => {
  const { db, user, masterVolume, setMasterVolume, jwtToken } = useVault();
  const { activeTrack } = usePlayer();
  return (
    <Capsules
      db={db}
      userId={user?.id ?? null}
      jwtToken={jwtToken}
      activeTrack={activeTrack}
      masterVolume={masterVolume}
      onVolumeChange={setMasterVolume}
    />
  );
};

// ─── TAB ROUTER ──────────────────────────────────────────────
const TAB_MAP = { vault: VaultPage, music: MusicPage, capsules: CapsulesPage };

// ─── AUTHENTICATED APP ───────────────────────────────────────
const AuthenticatedApp = () => {
  const {
      user: _user, db, dbStatus, lastHeartbeat,
      activeTab, setActiveTab,
      masterVolume: _masterVolume,
      logout,
      pendingDrop, clearPendingDrop,
    } = useVault();
  const { playTrack } = usePlayer();

  const ActivePage = TAB_MAP[activeTab] ?? VaultPage;

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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ActivePage />
          </motion.div>
        </AnimatePresence>
      </Layout>
    </>
  );
};

const UnauthorizedScreen = ({ userEmail }) => {
  return (
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
          className="px-6 py-2 text-xs font-bold tracking-[0.3em] uppercase transition-all"
          style={{ border: "1px solid #ff3b3b", color: "#ff3b3b" }}
        >
          REINTENTAR IDENTIFICACIÓN
        </button>
      </motion.div>
    </div>
  );
};

// ─── APP CORE (consumes VaultContext) ────────────────────────
const AppCore = () => {
  const { authStatus, bootPhase, bootError, isLoading, login, user, db } = useVault();

  if (isLoading) return <GlobalLoadingScreen phase={bootPhase} />;

  // NUEVO: Manejo explícito de usuario no autorizado
  if (authStatus === "unauthorized") {
    return <UnauthorizedScreen userEmail={user?.email} />;
  }

  if (authStatus === "error") {
    return <ErrorScreen message={bootError} onRetry={() => window.location.reload()} />;
  }

  if (authStatus !== "authenticated") {
    return <LoginScreen onLogin={login} isLoading={false} error={bootError} />;
  }

  const tracks = db?.music_lab?.tracks ?? [];
  const tags   = db?.music_lab?.tags   ?? [];
  return (
    <PlayerProvider userId={user?.id ?? null} tracks={tracks} tags={tags}>
      <AuthenticatedApp />
    </PlayerProvider>
  );
};

// ─── ROOT EXPORT ─────────────────────────────────────────────
export default function App() {
  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.info("[Búnker] SW registered:", reg.scope))
        .catch((err) => console.warn("[Búnker] SW registration failed:", err));
    }
  }, []);

  return (
    <VaultProvider>
      <AppCore />
    </VaultProvider>
  );
}
