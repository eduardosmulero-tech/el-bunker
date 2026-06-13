// ============================================================
//  EL BÚNKER — ChunkErrorBoundary.jsx
//  Error boundary para fallos de carga de chunks lazy.
//  Detecta ChunkLoadError (redes lentas/PWA offline) y
//  ofrece reintento (force remount vía key) + recarga completa.
// ============================================================
import { Component, Fragment } from "react";
import { motion } from "framer-motion";

const BG   = "#050505";
const ACID = "#bfff00";
const FONT = "'JetBrains Mono', 'Courier New', monospace";

const isChunkError = (error) =>
  error?.name === "ChunkLoadError" ||
  error?.message?.includes("Loading chunk") ||
  error?.message?.includes("Failed to fetch dynamically imported module") ||
  error?.message?.includes("Importing a module script failed");

export default class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, retrying: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    // Solo capturamos chunk errors; el resto los dejamos pasar
    if (isChunkError(error)) {
      return { error, retrying: false };
    }
    // No manejamos este error — componentDidCatch lo re-lanza
    return null;
  }

  componentDidCatch(error) {
    if (isChunkError(error)) {
      console.warn("[Búnker] Chunk load failed:", error.message);
    } else {
      // Re-lanzar errores no-chunk al boundary superior
      throw error;
    }
  }

  handleRetry = () => {
    // Incrementar retryCount fuerza remount del árbol lazy
    // (React.lazy cachea imports fallidos; el key nuevo lo resetea)
    this.setState((prev) => ({
      error: null,
      retrying: true,
      retryCount: prev.retryCount + 1,
    }));
    setTimeout(() => this.setState({ retrying: false }), 400);
    this.props.onRetry?.();
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4"
          style={{ background: BG, fontFamily: FONT }}
        >
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-3xl"
          >
            ⚡
          </motion.p>

          <p
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: "#ff3b3b", textShadow: "0 0 12px #ff3b3b" }}
          >
            ERROR DE CONEXIÓN
          </p>

          <p className="text-xs leading-relaxed opacity-50 max-w-xs" style={{ color: ACID }}>
            No se pudo cargar este módulo. Probablemente la red está lenta o inestable.
          </p>

          <div className="flex gap-2 mt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={this.handleRetry}
              disabled={this.state.retrying}
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 rounded-sm"
              style={{
                color: ACID,
                border: `1px solid ${ACID}44`,
                background: `${ACID}0d`,
                fontFamily: FONT,
                opacity: this.state.retrying ? 0.5 : 1,
              }}
            >
              {this.state.retrying ? "REINTENTANDO..." : "↻ REINTENTAR"}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 rounded-sm opacity-50"
              style={{
                color: ACID,
                border: `1px solid ${ACID}33`,
                fontFamily: FONT,
              }}
            >
              RECARGAR APP
            </motion.button>
          </div>
        </div>
      );
    }

    // key={retryCount} fuerza remount del sub-árbol lazy al reintentar.
    // React.lazy cachea promesas rechazadas; sin key nuevo, el retry no funciona.
    return (
      <Fragment key={this.state.retryCount}>
        {this.props.children}
      </Fragment>
    );
  }
}
