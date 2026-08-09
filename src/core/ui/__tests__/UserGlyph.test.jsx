// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import UserGlyph from "../UserGlyph";

describe("UserGlyph", () => {
  it("renders the exact persisted Unicode glyph instead of an Icon fallback", () => {
    const { container } = render(
      <div>
        <UserGlyph glyph="⚡" label="DnB" />
        <UserGlyph glyph="◎" label="420" />
        <UserGlyph glyph="◉" label="GAMING" />
      </div>
    );

    expect(screen.getByLabelText("DnB")).toHaveTextContent("⚡");
    expect(screen.getByLabelText("420")).toHaveTextContent("◎");
    expect(screen.getByLabelText("GAMING")).toHaveTextContent("◉");
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("does not invent a replacement when the persisted value is empty", () => {
    const { container } = render(<UserGlyph glyph="" decorative />);
    expect(container.textContent).toBe("");
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });
});
