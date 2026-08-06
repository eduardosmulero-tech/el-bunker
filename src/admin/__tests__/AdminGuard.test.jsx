import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AdminGuard from "../core/AdminGuard";

const child = <div>SECRET ADMIN UI</div>;

describe("AdminGuard", () => {
  it("1. loading no renderiza children", () => {
    render(<AdminGuard auth={{ isLoading: true, isAdmin: false }}>{child}</AdminGuard>);
    expect(screen.getByText("VERIFICANDO CREDENCIALES")).toBeInTheDocument();
    expect(screen.queryByText("SECRET ADMIN UI")).not.toBeInTheDocument();
  });

  it("2. no admin muestra denegado sin children", () => {
    render(<AdminGuard auth={{ isLoading: false, isAdmin: false }}>{child}</AdminGuard>);
    expect(screen.getByText("ACCESO DENEGADO")).toBeInTheDocument();
    expect(screen.queryByText("SECRET ADMIN UI")).not.toBeInTheDocument();
  });

  it("3. admin renderiza children", () => {
    render(<AdminGuard auth={{ isLoading: false, isAdmin: true }}>{child}</AdminGuard>);
    expect(screen.getByText("SECRET ADMIN UI")).toBeInTheDocument();
  });

  it("4. auth undefined se trata como loading", () => {
    render(<AdminGuard>{child}</AdminGuard>);
    expect(screen.getByText("VERIFICANDO CREDENCIALES")).toBeInTheDocument();
    expect(screen.queryByText("SECRET ADMIN UI")).not.toBeInTheDocument();
  });

  it("5. onRetry pinta el botón y lo llama", () => {
    const onRetry = vi.fn();
    render(<AdminGuard auth={{ isLoading: false, isAdmin: false }} onRetry={onRetry}>{child}</AdminGuard>);
    fireEvent.click(screen.getByRole("button", { name: "REINTENTAR" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
