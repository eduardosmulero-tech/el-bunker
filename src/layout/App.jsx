// ============================================================
//  EL BÚNKER — App.jsx
//  Orquestador Principal · Providers + Router (S116-L2 refactor)
//  Stack: React 18 + Framer Motion
// ============================================================
import { useEffect, useState, Component } from "react";

import { ToastProvider } from "../core/ToastContext";
import { VaultProvider, useVault } from "../core/VaultContext";
import { PlayerProvider } from "../core/PlayerContext";
import LoginScreen from "./LoginScreen";
import { ACID, BG, FONT_MONO as FONT } from "../tokens";
import { Icon } from "../core/ui";
import { GlobalLoadingScreen, ErrorScreen } from "./BootScreen";
import { AuthenticatedApp, UnauthorizedScreen } from "./TabShell";
import Contenido from "../admin/screens/Contenido";
import Salud from "../admin/screens/Salud";
import Auditoria from "../admin/screens/Auditoria";
import Accesos from "../admin/screens/Accesos";
import { createApiClient } from "../admin/core";
import { API_BASE } from "../core/WorkerClient";

// ─── S117: GLOBAL ERROR BOUNDARY ────────────────────────────
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Búnker] Unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-[300] px-8"
          style={{ background: BG, fontFamily: FONT }}
        >
          <div className="flex flex-col items-center gap-6 text-center max-w-sm">
            <Icon name="alert" size={36} label="Error inesperado" />
            <p className="text-xs tracking-[0.4em] uppercase" style={{ color: "#ff3b3b", textShadow: "0 0 12px #ff3b3b" }}>
              ERROR INESPERADO
            </p>
            <p className="text-xs leading-relaxed opacity-40" style={{ color: ACID }}>
              {this.state.error?.message?.slice(0, 120) ?? "Algo salió mal."}
            </p>
            <button
              onClick={() => { this.setState({ error: null, errorInfo: null }); window.location.reload(); }}
              className="text-xs tracking-[0.3em] uppercase px-6 py-3 min-h-[44px]"
              style={{
                color: ACID,
                border: `1px solid ${ACID}44`,
                background: `${ACID}08`,
                fontFamily: FONT,
              }}
            >
              REINICIAR APP <Icon name="arrowRight" size={14} decorative />
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── ADMIN PANEL (INT-Ola2, P12) ─────────────────────────────
// Ruta aparte /admin, fuera de los 3 tabs (ADR-017 🔒-4). El panel se monta
// ANTES del shell de tabs, por location.pathname, no dentro de él. La
// autorización la decide el Worker (B2, requireAdmin): el frontend esconde,
// no protege (plan OLA2 §1).
// Secciones: Contenido (B3) + consolas SALUD (B4), AUDITORÍA (B5) y ACCESOS (B6).
// El client del panel apunta al Worker API (API_BASE), igual que WorkerClient;
// sin baseUrl los fetch irían contra el origen de Vercel y darían 404
// (hallazgo de la auditoría visual 12-ago).
const ADMIN_SECTIONS = [
  { key: "contenido", label: "CONTENIDO", Screen: Contenido },
  { key: "salud", label: "SALUD", Screen: Salud },
  { key: "auditoria", label: "AUDITORÍA", Screen: Auditoria },
  { key: "accesos", label: "ACCESOS", Screen: Accesos },
];

const AdminPanel = () => {
  const { user, jwtToken } = useVault();
  const [section, setSection] = useState("contenido");
  const client = createApiClient({ baseUrl: API_BASE, getToken: () => jwtToken });
  const active = ADMIN_SECTIONS.find((s) => s.key === section) ?? ADMIN_SECTIONS[0];
  const Screen = active.Screen;
  return (
    <div style={{ background: BG, minHeight: "100dvh" }}>
      <nav
        aria-label="SECCIONES DEL PANEL"
        className="flex md:hidden"
        style={{ overflowX: "auto", borderBottom: `1px solid ${ACID}22`, gap: 4, padding: "8px 12px" }}
      >
        {ADMIN_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            style={{
              minHeight: 40,
              padding: "0 12px",
              color: s.key === active.key ? ACID : `${ACID}88`,
              background: "transparent",
              border: `1px solid ${s.key === active.key ? ACID : `${ACID}33`}`,
              fontFamily: FONT,
              letterSpacing: "0.16em",
              fontSize: 10,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <Screen key={active.key} client={client} user={user} />
    </div>
  );
};

// ─── APP CORE (consumes VaultContext) ────────────────────────
const AppCore = () => {
  const { authStatus, bootPhase, bootError, isLoading, login, loginWithAccessKey, user, db, jwtToken } = useVault();

  if (isLoading) return <GlobalLoadingScreen phase={bootPhase} />;

  if (authStatus === "unauthorized") {
    return <UnauthorizedScreen userEmail={user?.email} />;
  }

  if (authStatus === "error") {
    return <ErrorScreen message={bootError} onRetry={() => window.location.reload()} />;
  }

  if (authStatus !== "authenticated") {
    return (
      <LoginScreen
        onLogin={login}
        onAccessKeyLogin={loginWithAccessKey}
        isLoading={false}
        error={bootError}
      />
    );
  }

  const tracks = db?.music_lab?.tracks ?? [];
  const tags   = db?.music_lab?.tags   ?? [];

  // INT-Ola2 (P12): ruta aparte /admin, fuera de los 3 tabs (ADR-017 🔒-4).
  // El panel se monta ANTES del shell de tabs, por location.pathname.
  if (window.location.pathname.startsWith("/admin")) {
    return (
      <ToastProvider>
        <AdminPanel />
      </ToastProvider>
    );
  }

  return (
    <PlayerProvider userId={user?.id ?? null} tracks={tracks} tags={tags} jwtToken={jwtToken}>
      <ToastProvider>
        <AuthenticatedApp />
      </ToastProvider>
    </PlayerProvider>
  );
};

// ─── ROOT EXPORT ─────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.info("[Búnker] SW registered:", reg.scope))
        .catch((err) => console.warn("[Búnker] SW registration failed:", err));

      return undefined;
    }
  }, []);

  return (
    <VaultProvider>
      <GlobalErrorBoundary>
        <AppCore />
      </GlobalErrorBoundary>
    </VaultProvider>
  );
}
