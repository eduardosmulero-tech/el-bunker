// ============================================================
//  EL BÚNKER — BootScreen.jsx (S116-L2)
//  Pantallas de arranque: GlobalLoadingScreen + ErrorScreen + PageLoader
// ============================================================
import { motion } from "framer-motion";
import { ACID, BG, FONT_MONO as FONT } from "../tokens";
import { Icon } from "../core/ui";

// Suspense fallback compartido
export const PageLoader = () => (
  <div className="flex items-center justify-center py-12" style={{ fontFamily: FONT }}>
    <motion.p
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="text-xs tracking-[0.3em] uppercase"
      style={{ color: ACID }}
    >
      CARGANDO...
    </motion.p>
  </div>
);

// ─── GLOBAL LOADING SCREEN ───────────────────────────────────
/**
 * Shown during INIT_SERVICES and INIT_DB boot phases.
 * The heartbeat pulses faster when syncing DB.
 */
export const GlobalLoadingScreen = ({ phase }) => {
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
export const ErrorScreen = ({ message, onRetry }) => (
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
        <Icon name="alert" size={36} label="Error de sistema" />
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
        className="text-xs tracking-[0.3em] uppercase px-6 py-3 min-h-[44px]"
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
