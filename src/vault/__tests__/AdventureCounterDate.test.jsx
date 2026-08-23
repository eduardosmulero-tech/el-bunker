// @vitest-environment jsdom
// Fecha falsa adventures (V-6, iteracion 2): AdventureCounter debe recibir
// adventures_start_date real o null, nunca una fecha fabricada por el cliente.
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdventureCounter } from "../Vault.jsx";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_target, element) => ({ children, ...props }) =>
      React.createElement(element, props, children),
  }),
  AnimatePresence: ({ children }) => children,
}));

vi.mock("../../core/ui", () => ({
  Icon: ({ name, ...props }) => React.createElement("span", { ...props, "data-icon": name }),
  Skeleton: () => null,
  Button: ({ children, ...props }) => React.createElement("button", props, children),
  ConfirmDialog: () => null,
}));

vi.mock("../core/VaultContext", () => ({
  useVault: () => ({ user: null, patchDb: vi.fn(), updateEntry: vi.fn(), deleteEntry: vi.fn() }),
}));

vi.mock("../core/PlayerContext", () => ({
  usePlayer: () => ({ trackVibe: null, resolveVibeAccent: () => null }),
}));

vi.mock("../core/WorkerClient", () => ({
  workerClient: {},
}));

vi.mock("../core/ToastContext", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("../core/ChunkErrorBoundary", () => ({
  default: ({ children }) => children,
}));

vi.mock("../core/ColorPicker", () => ({
  ColorPicker: () => null,
}));

vi.mock("../tokens", () => ({
  ACID: "#bfff00",
  PURPLE: "#8b5cf6",
  GLASS_BG: "rgba(0,0,0,0.5)",
  GLASS_BORDER: "rgba(255,255,255,0.1)",
  FONT_MONO: "monospace",
  R2_PUBLIC_BASE: "https://r2.example.test",
}));

vi.mock("../AddEntryForm", () => ({
  default: () => null,
  ENTRY_TYPES: [],
  CATEGORY_FILTERS: [],
  CATEGORY_EXTRA_FIELDS: {},
  SECCION_TIPOS: {},
  tiposDeSeccion: () => [],
}));

vi.mock("../../layout/Layout", () => ({
  useSecondLevelNav: () => ({ secondLevel: { vault: "memoria" }, setSecondLevel: () => {} }),
}));

const NOW = new Date("2026-08-04T12:00:00.000Z");

const tickerText = (view) => view.getByText("días").parentElement.textContent;
const breakdownText = (view) => view.container.textContent;

describe("AdventureCounter — fecha real o null, nunca fabricada", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sin adventures_start_date (null) no fabrica fecha: contador en ceros", () => {
    const view = render(<AdventureCounter startDate={null} />);
    expect(tickerText(view)).toContain("0000");
    expect(breakdownText(view)).toContain("0Y");
    expect(breakdownText(view)).toContain("0M");
    expect(breakdownText(view)).toContain("0D");
  });

  it("sin adventures_start_date (undefined) no fabrica fecha: contador en ceros", () => {
    const view = render(<AdventureCounter startDate={undefined} />);
    expect(tickerText(view)).toContain("0000");
  });

  it("con adventures_start_date se conserva: contador con los dias reales", () => {
    const view = render(<AdventureCounter startDate="2025-06-04T12:00:00.000Z" />);
    expect(tickerText(view)).toContain("0426");
    expect(breakdownText(view)).toContain("1Y");
    expect(breakdownText(view)).toContain("2M");
    expect(breakdownText(view)).toContain("0D");
  });
});

describe("cableado en Vault.jsx — sin constante ni fallback de fecha fabricada", () => {
  it("deriva la cifra de días de la cabecera desde db?.adventures_start_date y no fabrica fecha", () => {
    const source = readFileSync(resolve(process.cwd(), "src/vault/Vault.jsx"), "utf8");
    // ADR-033 (punto 7): la cabecera de era absorbe AVENTURA EN CURSO como cifra
    // derivada de db?.adventures_start_date (nunca fabricada por el cliente).
    expect(source).toContain("timeSince(db?.adventures_start_date)");
    expect(source).not.toMatch(/Date\.now\(\)\s*-\s*500/);
  });
});
