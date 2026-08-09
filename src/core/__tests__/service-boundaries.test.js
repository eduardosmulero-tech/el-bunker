// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { getStreamUrl } from "../FileUploadService.js";

const read = (path) => readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
const sourceRoot = new URL("../../", import.meta.url);
const sourceFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const fullPath = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
  if (entry.isDirectory()) return sourceFiles(fullPath);
  return /\\.(js|jsx)$/.test(entry.name) ? [fullPath] : [];
});

describe("service boundaries", () => {
  it("builds playback URLs only from R2 keys", () => {
    expect(getStreamUrl("music/example.mp3")).toContain("/music/example.mp3");
    expect(getStreamUrl("")).toBeNull();
  });

  it("keeps the service worker API boundary explicit", () => {
    const sw = read("public/sw.js");
    expect(sw).toContain("startsWith(\"/api/\")");
    expect(sw).toContain("return; // browser handles normally — siempre network");
    expect(sw).not.toContain('addEventListener("sync"');
    expect(sw).not.toContain('addEventListener("push"');
    expect(sw).not.toContain("BUNKER_SYNC_READY");
    expect(sw).toContain("self.skipWaiting()");
    expect(sw).toContain("self.clients.claim()");
    expect(sw).toContain("async function networkFirstWithFallback");
    expect(sw).toContain("async function staleWhileRevalidate");

    const apiBranch = sw.slice(
      sw.indexOf('url.hostname === "el-bunker-api.thebunker-admin.workers.dev" && url.pathname.startsWith("/api/")'),
      sw.indexOf('url.hostname === "el-bunker-api.thebunker-admin.workers.dev" && url.pathname.startsWith("/music/")')
    );
    expect(apiBranch).toContain("return;");
    expect(apiBranch).not.toContain("event.respondWith");
    expect(apiBranch).not.toContain("cacheFirst");

    const audioBranch = sw.slice(
      sw.indexOf('url.hostname === "el-bunker-api.thebunker-admin.workers.dev" && url.pathname.startsWith("/music/")'),
      sw.indexOf("// ── 4. Same-origin assets")
    );
    expect(audioBranch).toContain("event.respondWith(cacheFirst(request))");
  });

  it("keeps PWA manifest references resolvable", () => {
    const manifest = JSON.parse(read("public/manifest.json"));
    const publicRoot = new URL("../../../public/", import.meta.url);
    const referenced = [
      ...manifest.icons.map((icon) => icon.src),
      ...manifest.shortcuts.flatMap((shortcut) => shortcut.icons?.map((icon) => icon.src) ?? []),
    ];
    expect(referenced.length).toBeGreaterThan(0);
    for (const asset of referenced) {
      expect(readFileSync(new URL(asset.slice(1), publicRoot))).toBeTruthy();
    }

    const smoke = read("src/smoke/SmokeSession.jsx");
    expect(smoke).toContain('icon: "/icons/icon-192.png"');
    expect(smoke).not.toContain("/manifest-icon-192.png");

    const gallery = read("src/vault/VaultGallery.jsx");
    expect(gallery).toContain('{ id: "wall",       icon: "grid",');
    expect(gallery).toContain('<Icon name={m.icon} size={14} decorative />');
    expect(gallery).not.toContain('{m.icon} {m.label}');
  });

  it("keeps Google authentication independent from Drive and D1/R2 persistence", () => {
    const auth = read("src/core/GoogleAuthService.js");

    expect(auth).not.toMatch(/auth\/drive|drive\.googleapis\.com|gapi(?:\.client)?|fetchData|updateData|patchDb/i);
    expect(auth).toContain("userinfo.email");
    expect(auth).toContain("userinfo.profile");
  });

  it("keeps Worker data loading behind the dedicated service boundary", () => {
    const vault = read("src/core/VaultContext.jsx");
    expect(vault).toContain('import { buildDbFromWorker } from "./WorkerDataService";');
    expect(vault).toContain("buildDbFromWorker(workerClient, DEFAULT_ADVENTURE_DATE)");
    expect(vault).not.toContain("const parsedEntries = (entries || []).map");
  });

  it("does not import the retired Drive facade from any source module", () => {
    for (const file of sourceFiles(sourceRoot)) {
      const contents = readFileSync(file, "utf8");
      expect(contents, file.pathname).not.toMatch(/(?:from\s+["'].*GoogleDriveService|import\(\s*["'].*GoogleDriveService|require\(\s*["'].*GoogleDriveService|import\s+["'].*GoogleDriveService)/);
    }
  });
});
