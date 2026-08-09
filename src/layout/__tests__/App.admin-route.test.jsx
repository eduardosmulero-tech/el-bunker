// INT-Ola2 (P12) — DoD 2: montaje en jsdom del enchufe del panel.
// Con pathname de administración se renderiza el shell del panel (Contenido →
// AdminShell); con la raíz se renderiza el shell de tabs (TabShell → Layout).
// Los contextos de datos se mockean (Vault/Player/WorkerClient) pero los SHELLS
// son reales: TERMINAL DE MANDO viene de AdminShell, los tabs de BottomNav.
import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "../App";

vi.mock("../../core/VaultContext", () => {
  const vault = {
    authStatus: "authenticated",
    isLoading: false,
    bootPhase: "ready",
    bootError: null,
    user: { id: "u1", email: "test@el-bunker.test", name: "Tester" },
    db: { music_lab: { tracks: [], tags: [] }, eras: [], entries: [] },
    jwtToken: "mock-token",
    activeTab: "vault",
    setActiveTab: () => {},
    logout: () => {},
    pendingDrop: null,
    clearPendingDrop: () => {},
    dbStatus: "ready",
    lastHeartbeat: null,
    masterVolume: 1,
    login: () => {},
    loginWithAccessKey: () => {},
    patchDb: () => {},
  };
  return {
    VaultProvider: ({ children }) => children,
    useVault: () => vault,
  };
});

vi.mock("../../core/PlayerContext", () => {
  const player = {
    playTrack: () => {},
    partnerListening: false,
    partnerTrack: null,
    partnerName: null,
    partnerTrackVibe: null,
    sessionId: null,
    activeTrack: null,
    isPlaying: false,
    audioRef: { current: null },
    skip: () => {},
    trackVibe: null,
    resolveVibeAccent: () => null,
    networkStatus: "online",
    sessionToast: null,
    setSessionToast: () => {},
  };
  return {
    PlayerProvider: ({ children }) => children,
    usePlayer: () => player,
  };
});

vi.mock("../../core/WorkerClient", () => ({
  workerClient: {
    get: () => Promise.resolve([]),
    fetch: () => Promise.resolve({ ok: true, status: 200, json: async () => ({}) }),
    hasToken: () => true,
  },
}));

vi.mock("../PageWrappers", () => ({
  VaultPage: () => <div>VAULT PAGE STUB</div>,
  MusicPage: () => <div>MUSIC PAGE STUB</div>,
  CapsulesPage: () => <div>CAPSULES PAGE STUB</div>,
}));

vi.mock("../../musiclab/DropsManager", () => ({
  DropAlertModal: () => null,
}));

vi.mock("../../admin/core", () => ({
  createApiClient: () => ({
    list: () => Promise.resolve({ items: [], total: 0 }),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    remove: () => Promise.resolve({}),
    action: () => Promise.resolve({}),
  }),
}));

const setPathname = (path) => window.history.pushState({}, "", path);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("INT-Ola2 — enchufe del panel admin (DoD 2)", () => {
  it("con pathname de administración renderiza el shell del panel", async () => {
    setPathname("/admin");
    render(<App />);
    await screen.findByText("TERMINAL DE MANDO");
    for (const label of ["ENTRADAS", "ARCHIVOS", "TRACKS", "PLAYLISTS", "CÁPSULAS", "DROPS"]) {
      expect(screen.getAllByRole("button", { name: label }).length, label).toBeGreaterThan(0);
    }
    // El shell de tabs NO está en la ruta de administración.
    expect(screen.queryByRole("button", { name: "MUSIC LAB" })).not.toBeInTheDocument();
    cleanup();
  });

  it("con la raíz renderiza el shell de tabs", async () => {
    setPathname("/");
    render(<App />);
    await wait(300);
    const buttons = screen.getAllByRole("button");
    const names = buttons.map((b) => b.textContent.trim());
    expect(names).toContain("VAULT");
    expect(names).toContain("MUSIC LAB");
    expect(names).toContain("CAPSULES");
    // El shell del panel NO está en la raíz.
    expect(screen.queryByText("TERMINAL DE MANDO")).not.toBeInTheDocument();
    cleanup();
  });
});
