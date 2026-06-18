// ============================================================
//  EL BÚNKER — App.jsx
//  Orquestador Principal · Providers + Router (S116-L2 refactor)
//  Stack: React 18 + Framer Motion
// ============================================================
import { useEffect, Component } from "react";

import { ToastProvider } from "../core/ToastContext";
import { VaultProvider, useVault } from "../core/VaultContext";
import { PlayerProvider } from "../core/PlayerContext";
import LoginScreen from "./LoginScreen";
import { ACID, BG, FONT_MONO as FONT } from "../tokens";
import { GlobalLoadingScreen, ErrorScreen } from "./BootScreen";
import { AuthenticatedApp, UnauthorizedScreen } from "./TabShell";

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
            <p className="text-4xl">⚠</p>
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
              REINICIAR APP →
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── APP CORE (consumes VaultContext) ────────────────────────
const AppCore = () => {
  const { authStatus, bootPhase, bootError, isLoading, login, user, db, jwtToken } = useVault();

  if (isLoading) return <GlobalLoadingScreen phase={bootPhase} />;

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

      const handleSWMessage = (event) => {
        if (event.data?.type === "BUNKER_NAVIGATE" && event.data?.tab) {
          window.dispatchEvent(new CustomEvent("bunker_navigate", { detail: { tab: event.data.tab } }));
        }
      };
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
      return () => navigator.serviceWorker.removeEventListener("message", handleSWMessage);
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
