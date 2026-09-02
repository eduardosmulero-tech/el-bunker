// Tests de playerMath — port fastpotify (curva de volumen + umbral de escucha).
import { describe, it, expect } from "vitest";
import { gananciaVolumen, sliderDesdeGanancia, umbralEscucha } from "../playerMath";

describe("gananciaVolumen — curva perceptual (port fastpotify)", () => {
  it("extremos exactos: 0 → 0, 100 → 1", () => {
    expect(gananciaVolumen(0)).toBe(0);
    expect(gananciaVolumen(100)).toBeCloseTo(1);
  });

  it("el centro del slider atenúa más que lineal (−12 dB vs −6 dB)", () => {
    // lineal daría 0.5 (−6 dB); la curva v² da 0.25 (−12 dB): control fino abajo
    expect(gananciaVolumen(50)).toBeCloseTo(0.25);
  });

  it("zona baja útil: 10% de slider → 1% de ganancia (−40 dB)", () => {
    expect(gananciaVolumen(10)).toBeCloseTo(0.01);
  });

  it("clampa entradas fuera de rango y basura", () => {
    expect(gananciaVolumen(-5)).toBe(0);
    expect(gananciaVolumen(150)).toBeCloseTo(1);
    expect(gananciaVolumen(NaN)).toBe(0);
    expect(gananciaVolumen(undefined)).toBe(0);
  });
});

describe("sliderDesdeGanancia — inversa para leer el <audio> (BUG-22)", () => {
  it("ida y vuelta exacta en valores representativos", () => {
    for (const slider of [0, 10, 25, 50, 75, 90, 100]) {
      expect(sliderDesdeGanancia(gananciaVolumen(slider))).toBe(slider);
    }
  });

  it("clampa y degrada con gracefully con basura", () => {
    expect(sliderDesdeGanancia(1.5)).toBe(100);
    expect(sliderDesdeGanancia(-0.2)).toBe(0);
    expect(sliderDesdeGanancia(NaN)).toBe(0);
  });
});

describe("umbralEscucha — un play cuenta tras 30s o mitad del track", () => {
  it("track largo (4 min) → 30s, como Spotify", () => {
    expect(umbralEscucha(240)).toBe(30);
  });

  it("track corto (40s) → 20s (la mitad)", () => {
    expect(umbralEscucha(40)).toBe(20);
  });

  it("duración desconocida o cero → 30s por defecto", () => {
    expect(umbralEscucha(0)).toBe(30);
    expect(umbralEscucha(NaN)).toBe(30);
  });

  it("nunca menos de 1s aunque el track sea minúsculo", () => {
    expect(umbralEscucha(1)).toBe(1);
    expect(umbralEscucha(0.5)).toBe(1);
  });
});
