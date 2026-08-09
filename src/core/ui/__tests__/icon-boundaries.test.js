// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const read = (file) => readFileSync(resolve(ROOT, file), "utf8");

describe("icon boundaries", () => {
  it("keeps user tag glyphs outside the Icon resolver", () => {
    for (const file of [
      "src/musiclab/TagManager.jsx",
      "src/musiclab/TrackCard.jsx",
      "src/musiclab/AddTrackForm.jsx",
      "src/musiclab/MusicLab.jsx",
      "src/musiclab/WinampPlayer.jsx",
    ]) {
      const source = read(file);
      expect(source).toContain("UserGlyph");
      expect(source).not.toMatch(/<Icon\s+name=\{(?:form|tag|vibe|hVibe|qVibe|plVibe)(?:\?\.)?\.?(?:icon)?/);
    }
  });

  it("centers icon-bearing errors as one inline-flex group", () => {
    expect(read("src/layout/LoginScreen.jsx")).toContain("inline-flex items-center justify-center gap-2");
    expect(read("src/capsules/Capsules.jsx")).toContain("inline-flex items-center justify-center gap-2");
    expect(read("src/capsules/Recaps.jsx")).toContain("inline-flex items-center justify-center gap-2");
  });
});
