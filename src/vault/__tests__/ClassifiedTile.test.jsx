// ClassifiedTile — tesela esmerilada del Modo Visita (A5).
// Verifica: etiqueta CLASIFICADO, fecha de la forma saneada (fecha/era),
// ausencia de emoji (regla de Edu: iconos SVG) y que el original no se pinta.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ClassifiedTile from "../ClassifiedTile";

const SANITIZED = {
  id: "entry-1",
  classified: true,
  blurhash: null,
  fecha: "2026-08-01T10:00:00.000Z",
  era: "era-playa",
};

const ERA = { id: "era-playa", name: "PLAYA 26", color: "#00ffcc" };

// Rango emoji/dingbats amplio (cubre emojis y glifos heredados).
const EMOJI_RE = /\p{Extended_Pictographic}/u;

describe("ClassifiedTile", () => {
  it("pinta la tesela CLASIFICADO con fecha y era, sin contenido del original", () => {
    render(<ClassifiedTile entry={SANITIZED} era={ERA} />);
    expect(screen.getByText("CLASIFICADO")).toBeInTheDocument();
    expect(screen.getByText(/1 ago 2026/i)).toBeInTheDocument();
    expect(screen.getByText("PLAYA 26")).toBeInTheDocument();
    // El original nunca viaja (diseño §3): no puede haber título ni r2_key en pantalla.
    expect(screen.queryByText(/título original/i)).not.toBeInTheDocument();
  });

  it("no usa emoji: el texto visible de la tesela es solo ASCII/latino (iconos SVG)", () => {
    const { container } = render(<ClassifiedTile entry={SANITIZED} era={ERA} />);
    expect(container.textContent).not.toMatch(EMOJI_RE);
  });

  it("en tamaño mini no pinta etiqueta ni fecha (thumbs compactos)", () => {
    const { container } = render(<ClassifiedTile entry={SANITIZED} era={ERA} size="mini" />);
    expect(screen.queryByText("CLASIFICADO")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/ago/i);
  });

  it("sin fecha no pinta fecha y sin era no pinta nombre de era", () => {
    render(<ClassifiedTile entry={{ id: "x", classified: true }} era={null} />);
    expect(screen.getByText("CLASIFICADO")).toBeInTheDocument();
    expect(screen.queryByText(/ago/i)).not.toBeInTheDocument();
  });

  it("tolera una entry completa (no saneada) sin romper: prioriza created_at", () => {
    render(
      <ClassifiedTile
        entry={{ id: "y", classified: true, created_at: "2026-07-15T00:00:00.000Z", era_id: ERA.id }}
        era={ERA}
      />
    );
    expect(screen.getByText(/15 jul 2026/i)).toBeInTheDocument();
  });
});
