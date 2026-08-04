// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadCastSdk, resetCastSdkForTests } from "../CastSdkService.js";

describe("CastSdkService", () => {
  beforeEach(() => {
    resetCastSdkForTests();
    delete window.cast;
    delete window.chrome;
    delete window.__onGCastApiAvailable;
    document.querySelectorAll("script[data-bunker-cast]").forEach((script) => script.remove());
  });

  it("does not inject a script when Cast is already available", async () => {
    window.cast = { framework: {} };
    window.chrome = { cast: {} };
    await expect(loadCastSdk()).resolves.toBe(true);
    expect(document.querySelector("script[data-bunker-cast]")).toBeNull();
  });

  it("injects one HTTPS script and deduplicates concurrent requests", async () => {
    const first = loadCastSdk();
    const second = loadCastSdk();
    const script = [...document.scripts].find((candidate) => candidate.src.includes("cast_sender.js"));
    expect(first).toBe(second);
    expect(script?.src).toMatch(/^https:\/\/www\.gstatic\.com\//);

    window.cast = { framework: {} };
    window.chrome = { cast: {} };
    window.__onGCastApiAvailable(true);
    await expect(first).resolves.toBe(true);
  });

  it("resolves false when the SDK script fails and permits a retry", async () => {
    const first = loadCastSdk();
    const firstScript = [...document.scripts].find((candidate) => candidate.src.includes("cast_sender.js"));
    firstScript.onerror?.(new Error("offline"));
    await expect(first).resolves.toBe(false);

    const second = loadCastSdk();
    expect(second).not.toBe(first);
    const secondScript = [...document.scripts].find((candidate) => candidate !== firstScript && candidate.src.includes("cast_sender.js"));
    secondScript.onerror?.(new Error("offline"));
    await expect(second).resolves.toBe(false);
  });
});
