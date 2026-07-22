#!/usr/bin/env node
// ============================================================
//  EL BÚNKER — tools/import-vault.mjs
//  Importación masiva de fotos/vídeos al VAULT
//  Origen: Google Takeout + carpeta del móvil por USB
//  Dedupe multi-señal + dry-run por defecto + resumibilidad
// ============================================================

import { readFile, readdir, stat, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { createInterface } from "node:readline";
import exifr from "exifr";

// ─── CONSTANTS ──────────────────────────────────────────────
const API_BASE = process.env.BUNKER_API || "https://el-bunker-api.thebunker-admin.workers.dev";
const DEFAULT_MANIFEST = "./import-manifest.json";
const DEFAULT_CONCURRENCY = 3;

const PHOTO_EXT = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".gif", ".bmp", ".tiff"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".avi", ".mkv", ".3gp", ".wmv", ".webm"]);

const MEDIA_TYPE = (ext) => {
  const e = ext.toLowerCase();
  if (PHOTO_EXT.has(e)) return "photo";
  if (VIDEO_EXT.has(e)) return "video";
  return null;
};

const PREFIX_FOR = (mediaType) => mediaType === "video" ? "vault/videos" : "vault/photos";

const DEFAULT_IO_CONCURRENCY = 16;
// El hashing lee el archivo COMPLETO (fotos/videos, no JSON pequenos) — concurrencia alta aqui
// genera seek thrashing en disco y va MAS LENTO que secuencial (medido: 16 en paralelo tardaba
// ~10min por cada 500 hashes, cuando secuencial hacia los 16111 completos en pocos minutos).
const HASH_CONCURRENCY = 3;

/** Run an async worker over `items` with bounded concurrency.
 *  Calls onProgress(doneCount, total) after each completed item. */
async function runPool(items, concurrency, worker, onProgress) {
  const queue = [...items];
  let done = 0;
  const runners = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
      done++;
      if (onProgress) onProgress(done, items.length);
    }
  });
  await Promise.all(runners);
}

// Screenshot detection patterns (filename-based heuristics)
const SCREENSHOT_PATTERNS = /^(screenshot|captura|screen|capture|recording|grabacion|pantalla|snap)/i;
function isLikelyScreenshot(filename) {
  return SCREENSHOT_PATTERNS.test(basename(filename, extname(filename)));
}

// ─── CLI ARGS ───────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: true, concurrency: DEFAULT_CONCURRENCY, manifestPath: DEFAULT_MANIFEST, apiBase: API_BASE };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--takeout": opts.takeoutDir = args[++i]; break;
      case "--mobile": opts.mobileDir = args[++i]; break;
      case "--token": opts.token = args[++i]; break;
      case "--stage": opts.stageDir = args[++i]; break;
      case "--staged": opts.stagedDir = args[++i]; break;
      case "--commit": opts.dryRun = false; break;
      case "--dry-run": opts.dryRun = true; break;
      case "--api": opts.apiBase = args[++i]; break;
      case "--manifest": opts.manifestPath = args[++i]; break;
      case "--concurrency": opts.concurrency = parseInt(args[++i], 10) || DEFAULT_CONCURRENCY; break;
      case "--help": case "-h": printHelp(); process.exit(0);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
EL BÚNKER — import-vault.mjs
Importación masiva de fotos/vídeos al VAULT desde Google Takeout + móvil.

USO DIRECTO (sin revisión manual):
  node tools/import-vault.mjs --takeout <dir> --mobile <dir> --token <jwt> [opciones]

USO CON STAGING (revisión manual antes de subir):
  # Paso 1: Preparar staging para revisión
  node tools/import-vault.mjs --takeout <dir> --mobile <dir> --stage <carpeta>
  # Paso 2: Revisar y borrar manualmente en el Explorador lo que no quieras subir
  # Paso 3: Subir desde staging
  node tools/import-vault.mjs --staged <carpeta> --token <jwt> [--commit]

REQUERIDO:
  Para modo directo:       --takeout, --mobile, --token
  Para staging (paso 1):   --takeout, --mobile, --stage  (sin --token, sin --commit)
  Para staging (paso 3):   --staged, --token

OPCIONES:
  --stage <path>      Copiar archivos a carpeta de revisión (solo copia, no sube)
  --staged <path>     Subir desde carpeta de staging ya revisada
  --commit            Ejecutar subida real (por defecto: dry-run, solo reporta)
  --api <url>         URL base de la API (defecto: ${API_BASE})
  --manifest <path>   Archivo de manifiesto de resumibilidad (defecto: ${DEFAULT_MANIFEST})
  --concurrency <n>   Subidas paralelas (defecto: ${DEFAULT_CONCURRENCY})
  --help, -h          Esta ayuda

CÓMO OBTENER EL TOKEN:
  1. Abre https://el-bunker-beige.vercel.app en Chrome
  2. Inicia sesión con Google
  3. Abre DevTools (F12) > Application > Local Storage
  4. Copia el valor de 'bunker_token'
  5. Pásalo con --token "<valor>"

EJEMPLOS:
  # Flujo directo — dry-run
  node tools/import-vault.mjs --takeout ./takeout-2026 --mobile ./dcim --token "eyJ..."

  # Flujo directo — subida real
  node tools/import-vault.mjs --takeout ./takeout-2026 --mobile ./dcim --token "eyJ..." --commit

  # Flujo staging — paso 1 (copiar a D:unker-review)
  node tools/import-vault.mjs --takeout ./takeout-2026 --mobile ./dcim --stage D:unker-review

  # Flujo staging — paso 3 (subir desde staging, primero dry-run)
  node tools/import-vault.mjs --staged D:unker-review --token "eyJ..."

  # Flujo staging — paso 3 con commit
  node tools/import-vault.mjs --staged D:unker-review --token "eyJ..." --commit
`);
}

// ─── METADATA EXTRACTION ────────────────────────────────────

/** Extract metadata from a Takeout .json sidecar file */
async function extractTakeoutMetadata(jsonPath) {
  try {
    const raw = await readFile(jsonPath, "utf-8");
    const data = JSON.parse(raw);

    const ts = data.photoTakenTime?.timestamp;
    const dateTaken = ts ? new Date(parseInt(ts, 10) * 1000).toISOString() : null;

    return {
      dateTaken,
      latitude: data.geoData?.latitude ?? null,
      longitude: data.geoData?.longitude ?? null,
      title: data.title || null,
      description: data.description || null,
      source: "takeout",
    };
  } catch {
    return { source: "takeout" };
  }
}

/** Extract EXIF metadata from an image/video file using exifr */
async function extractExifMetadata(filePath) {
  try {
    const data = await exifr.parse(filePath, {
      pick: ["DateTimeOriginal", "CreateDate", "GPSLatitude", "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef"],
      gps: true,
    });

    if (!data) return { source: "exif" };

    const dateStr = data.DateTimeOriginal || data.CreateDate || null;
    let dateTaken = null;
    if (dateStr) {
      // EXIF dates: "2024:03:15 19:30:00"
      const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) dateTaken = d.toISOString();
    }

    let lat = data.latitude ?? null;
    let lng = data.longitude ?? null;
    // Normalize negative coordinates based on ref
    if (lat != null && data.GPSLatitudeRef === "S") lat = -Math.abs(lat);
    if (lng != null && data.GPSLongitudeRef === "W") lng = -Math.abs(lng);

    return { dateTaken, latitude: lat, longitude: lng, source: "exif" };
  } catch {
    return { source: "exif" };
  }
}

// ─── SCANNING ───────────────────────────────────────────────

async function scanDirectory(dir, sourceLabel) {
  const files = [];
  const stack = [dir];

  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch { continue; }

    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        const mediaType = MEDIA_TYPE(ext);
        if (mediaType) {
          let fileStat;
          try { fileStat = await stat(fullPath); } catch { continue; }
          files.push({
            filePath: fullPath,
            filename: entry.name,
            ext,
            mediaType,
            size: fileStat.size,
            mtime: fileStat.mtime.toISOString(),
            source: sourceLabel,
          });
        }
      }
    }
  }
  return files;
}

// ─── HASHING ────────────────────────────────────────────────

async function computeHash(filePath, algorithm = "sha256", chunkLimit = 0) {
  return new Promise((resolve, reject) => {
    const hash = createHash(algorithm);
    const stream = createReadStream(filePath);
    let bytesRead = 0;

    stream.on("data", (chunk) => {
      if (chunkLimit && bytesRead >= chunkLimit) return;
      const toRead = chunkLimit ? Math.min(chunk.length, chunkLimit - bytesRead) : chunk.length;
      if (toRead > 0) hash.update(chunk.subarray(0, toRead));
      bytesRead += chunk.length;
      if (chunkLimit && bytesRead >= chunkLimit) {
        stream.destroy();
        resolve(hash.digest("hex"));
      }
    });

    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

// ─── DEDUPLICATION ──────────────────────────────────────────

/** Dedupe within a single source using exact file hash */
function dedupeWithinSource(files, hashes) {
  const seen = new Map();
  const unique = [];
  const dupes = [];

  for (const f of files) {
    const h = hashes.get(f.filePath);
    if (!h) { unique.push(f); continue; }

    const existing = seen.get(h);
    if (existing) {
      dupes.push({ file: f, reason: `hash-exact duplicate of ${relative(".", existing.filePath)}` });
    } else {
      seen.set(h, f);
      unique.push(f);
    }
  }
  return { unique, dupes };
}

/** Check if two dates are within threshold seconds */
function datesWithin(d1, d2, seconds) {
  if (!d1 || !d2) return false;
  return Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) <= seconds * 1000;
}

/** Haversine distance in meters between two lat/lng pairs */
function haversineDistance(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Multi-signal dedupe between Takeout and mobile files */
function dedupeCrossSource(takeoutFiles, mobileFiles, firstChunkHashes) {
  const dupes = [];
  const matchedMobile = new Set();

  for (const t of takeoutFiles) {
    for (const m of mobileFiles) {
      if (matchedMobile.has(m.filePath)) continue;

      const tHash = firstChunkHashes.get(t.filePath);
      const mHash = firstChunkHashes.get(m.filePath);
      if (!tHash || !mHash) continue;

      let score = 0;

      // Signal 1: same filename base (value 1)
      const tBase = basename(t.filename, extname(t.filename)).toLowerCase();
      const mBase = basename(m.filename, extname(m.filename)).toLowerCase();
      if (tBase === mBase) score += 1;

      // Signal 2: first-64KB hash match (value 2 — strong signal)
      if (tHash === mHash) score += 2;

      // Signal 3: timestamp proximity ±5s (value 1)
      if (datesWithin(t.metadata?.dateTaken, m.metadata?.dateTaken, 5)) score += 1;

      // Signal 4: GPS proximity ±100m (value 1)
      const dist = haversineDistance(t.metadata?.latitude, t.metadata?.longitude, m.metadata?.latitude, m.metadata?.longitude);
      if (dist <= 100) score += 1;

      // Signal 5: size similarity ±30% (value 1)
      if (t.size && m.size) {
        const ratio = Math.max(t.size, m.size) / Math.min(t.size, m.size);
        if (ratio <= 1.3) score += 1;
      }

      // Threshold: ≥4 out of 6 signals
      if (score >= 4) {
        dupes.push({
          file: m,
          reason: `cross-source duplicate of Takeout "${t.filename}" (score=${score}/6)`,
        });
        matchedMobile.add(m.filePath);
      }
    }
  }

  return { dupes, matchedMobile };
}

// ─── API HELPERS ────────────────────────────────────────────

async function apiCall(path, options, token) {
  const url = `${options.apiBase}${path}`;
  const isBinaryPut = options.method === "PUT" && options.body instanceof Uint8Array;

  const headers = isBinaryPut
    ? { Authorization: `Bearer ${token}`, "Content-Type": options.contentType || "application/octet-stream" }
    : { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: isBinaryPut
      ? options.body
      : (options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }

  if (!res.ok) throw new Error(`${path}: ${res.status} — ${data.error || text}`);
  return data;
}

// ─── UPLOAD FLOW ────────────────────────────────────────────

async function uploadSingleFile(file, opts, stats) {
  const { token, apiBase } = opts;
  const prefix = PREFIX_FOR(file.mediaType);
  const ext = file.ext.slice(1).toLowerCase();
  const mimeType = file.mediaType === "video"
    ? `video/${ext}`
    : `image/${ext === "jpg" ? "jpeg" : ext}`;

  // Step 1: Generate pre-signed R2 key
  const { r2_key, file_id } = await apiCall("/api/upload", {
    method: "POST",
    body: { prefix, filename: file.filename, mime_type: mimeType, size_bytes: file.size },
    apiBase,
  }, token);

  // Step 2: Upload binary to R2
  const fileData = await readFile(file.filePath);
  await apiCall(`/api/upload/${encodeURIComponent(r2_key)}`, {
    method: "PUT",
    body: new Uint8Array(fileData),
    contentType: mimeType,
    apiBase,
  }, token);

  // Step 3: Create entry
  const entryType = file.mediaType === "video" ? "video" : "photo";
  const content = {
    text: file.metadata?.description || "",
    images: [{ r2_key, media_type: file.mediaType }],
  };
  if (file.metadata?.latitude != null) content.lat = file.metadata.latitude;
  if (file.metadata?.longitude != null) content.lng = file.metadata.longitude;
  const eventDate = file.metadata?.dateTaken || file.mtime;
  if (eventDate) content.event_date = eventDate;

  const entry = await apiCall("/api/entries", {
    method: "POST",
    body: {
      type: entryType,
      title: file.metadata?.title || file.filename,
      from_user: "edu",
      created_at: file.metadata?.dateTaken || file.mtime,
      content,
      file_ids: [file_id],
    },
    apiBase,
  }, token);

  stats.uploaded++;
  return { r2_key, file_id, entryId: entry.id };
}

async function uploadBatch(files, opts, manifest) {
  const { token, apiBase, concurrency } = opts;
  const stats = { uploaded: 0, failed: 0, skipped: 0 };
  const uploaded = new Set(Object.keys(manifest.entries || {}));

  // Filter out already-uploaded (by file hash)
  const toUpload = [];
  for (const f of files) {
    if (uploaded.has(f.hash)) {
      stats.skipped++;
    } else {
      toUpload.push(f);
    }
  }

  console.log(`\nSubiendo ${toUpload.length} archivos (${stats.skipped} ya en manifiesto)...\n`);

  // Upload with concurrency limit using a simple queue
  const queue = [...toUpload];
  let running = 0;
  let completed = 0;
  const total = queue.length;

  return new Promise((resolve) => {
    const runNext = async () => {
      if (!queue.length) {
        if (running === 0) resolve(stats);
        return;
      }
      const file = queue.shift();
      running++;
      try {
        const result = await uploadSingleFile(file, { token, apiBase }, stats);
        manifest.entries[file.hash] = { ...result, filename: file.filename, uploadedAt: new Date().toISOString() };
        completed++;
        console.log(`  [${completed}/${total}] ${file.filename}`);
      } catch (e) {
        stats.failed++;
        console.error(`  ERROR ${file.filename}: ${e.message}`);
        // Save partial manifest on failure to not lose progress
        await saveManifest(manifest);
      } finally {
        running--;
        if (!queue.length && running === 0) resolve(stats);
        // Keep pool filled
        while (running < concurrency && queue.length) runNext();
      }
    };

    // Start initial batch
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) runNext();
  });
}

// ─── MANIFEST ───────────────────────────────────────────────

async function loadManifest(path) {
  try {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    return { path, entries: data.entries || {}, stats: data.stats || {} };
  } catch {
    return { path, entries: {}, stats: {} };
  }
}

async function saveManifest(manifest) {
  await writeFile(manifest.path, JSON.stringify({
    entries: manifest.entries,
    stats: manifest.stats,
    updatedAt: new Date().toISOString(),
  }, null, 2));
}

// ─── STAGING ──────────────────────────────────────────────

/** Copy deduplicated files to a staging folder for manual review.
 *  Organizes by year-month from capture date.
 *  Writes staging-manifest.json with metadata for later upload. */
async function stageFiles(finalFiles, stageDir) {
  await mkdir(stageDir, { recursive: true });
  const manifest = { files: {}, stagedAt: new Date().toISOString() };
  let copied = 0;
  let screenshots = 0;

  const screenshotDir = join(stageDir, '_posibles_capturas');

  for (const f of finalFiles) {
    const date = f.metadata?.dateTaken || f.mtime;
    const d = new Date(date);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    let targetDir = join(stageDir, ym);
    let targetName = `${f.source}_${f.filename}`;

    if (isLikelyScreenshot(f.filename)) {
      targetDir = screenshotDir;
      screenshots++;
    }

    await mkdir(targetDir, { recursive: true });

    let destPath = join(targetDir, targetName);
    let counter = 1;
    const baseName = targetName.replace(extname(targetName), '');
    const ext = extname(targetName);
    while (true) {
      try {
        await copyFile(f.filePath, destPath);
        break;
      } catch (e) {
        if (e.code === 'EEXIST' || e.code === 'EPERM') {
          counter++;
          destPath = join(targetDir, `${baseName}_${counter}${ext}`);
        } else {
          throw e;
        }
      }
    }

    manifest.files[f.hash] = {
      hash: f.hash,
      stagingPath: destPath,
      originalPath: f.filePath,
      filename: targetName,
      mediaType: f.mediaType,
      size: f.size,
      dateTaken: f.metadata?.dateTaken || null,
      latitude: f.metadata?.latitude ?? null,
      longitude: f.metadata?.longitude ?? null,
      title: f.metadata?.title || null,
      description: f.metadata?.description || null,
      source: f.source,
    };
    copied++;
  }

  const manifestPath = join(stageDir, 'staging-manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n=== STAGING COMPLETO ===`);
  console.log(`Copiados:     ${copied}`);
  console.log(`Posibles capturas: ${screenshots} (en _posibles_capturas/)`);
  console.log(`Carpeta:      ${stageDir}`);
  console.log(`Manifiesto:   ${manifestPath}`);
  console.log(`\nAhora revisa la carpeta en el Explorador, borra lo que no quieras subir,`);
  console.log(`y ejecuta: node tools/import-vault.mjs --staged ${stageDir} --token "<jwt>"`);
}

/** Load staging manifest from a staged folder */
async function loadStagingManifest(stageDir) {
  const manifestPath = join(stageDir, 'staging-manifest.json');
  const raw = await readFile(manifestPath, 'utf-8');
  const data = JSON.parse(raw);
  return data.files || {};
}

/** Scan a staging folder (after manual review) for remaining media files */
async function scanStagedDirectory(stageDir) {
  const files = [];
  const stack = [stageDir];

  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch { continue; }

    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        const name = entry.name;
        if (name === 'staging-manifest.json') continue;
        const ext = extname(name).toLowerCase();
        const mediaType = MEDIA_TYPE(ext);
        if (mediaType) {
          let fileStat;
          try { fileStat = await stat(fullPath); } catch { continue; }
          files.push({
            filePath: fullPath,
            filename: name,
            ext,
            mediaType,
            size: fileStat.size,
            mtime: fileStat.mtime.toISOString(),
            source: 'staged',
          });
        }
      }
    }
  }
  return files;
}

// ─── MAIN DISPATCHER ───────────────────────────────────────

async function mainDirect(opts) {
  // Phase 1: Scan
  console.log('Escaneando directorios...');
  const [takeoutFiles, mobileFiles] = await Promise.all([
    scanDirectory(opts.takeoutDir, 'takeout'),
    scanDirectory(opts.mobileDir, 'mobile'),
  ]);

  const tfPhotos = takeoutFiles.filter(f => f.mediaType === 'photo').length;
  const tfVideos = takeoutFiles.filter(f => f.mediaType === 'video').length;
  const mfPhotos = mobileFiles.filter(f => f.mediaType === 'photo').length;
  const mfVideos = mobileFiles.filter(f => f.mediaType === 'video').length;

  console.log(`  Takeout: ${takeoutFiles.length} archivos (${tfPhotos} fotos, ${tfVideos} videos)`);
  console.log(`  Movil:   ${mobileFiles.length} archivos (${mfPhotos} fotos, ${mfVideos} videos)`);

  if (!takeoutFiles.length && !mobileFiles.length) {
    console.log('\nNo se encontraron archivos de foto/video.\n');
    process.exit(0);
  }

  // Phase 2: Metadata (paralelo, I/O-bound — miles de lecturas pequeñas)
  console.log('\nExtrayendo metadatos...');
  await runPool(takeoutFiles, DEFAULT_IO_CONCURRENCY, async (f) => {
    const jsonPath = f.filePath + '.json';
    const altJsonPath = f.filePath.replace(extname(f.filePath), '') + extname(f.filePath) + '.supplemental-metadata.json';
    let meta = await extractTakeoutMetadata(jsonPath);
    if (!meta.dateTaken) meta = await extractTakeoutMetadata(altJsonPath);
    f.metadata = meta;
  }, (done, total) => {
    if (done % 500 === 0 || done === total) console.log(`  Takeout metadata: ${done}/${total}...`);
  });

  await runPool(mobileFiles, DEFAULT_IO_CONCURRENCY, async (f) => {
    f.metadata = await extractExifMetadata(f.filePath);
  }, (done, total) => {
    if (done % 100 === 0 || done === total) console.log(`  EXIF: ${done}/${total}...`);
  });

  const allScanned = [...takeoutFiles, ...mobileFiles];
  const withDate = allScanned.filter(f => f.metadata?.dateTaken).length;
  const withGps = allScanned.filter(f => f.metadata?.latitude != null).length;
  console.log(`  Metadatos: ${withDate} con fecha, ${withGps} con GPS`);

  // Phase 3: Hashes — concurrencia baja a proposito, ver HASH_CONCURRENCY arriba.
  console.log('\nCalculando hashes...');
  const fullHashes = new Map();
  const chunkHashes = new Map();
  await runPool(allScanned, HASH_CONCURRENCY, async (f) => {
    const full = await computeHash(f.filePath);
    const chunk = await computeHash(f.filePath, 'sha256', 65536);
    fullHashes.set(f.filePath, full);
    chunkHashes.set(f.filePath, chunk);
    f.hash = full;
  }, (done, total) => {
    if (done % 500 === 0 || done === total) console.log(`  Hash: ${done}/${total}...`);
  });
  console.log(`  ${allScanned.length} hashes calculados`);

  // Phase 4: Dedupe
  console.log('\nDeduplicando...');
  const takeoutDeduped = dedupeWithinSource(takeoutFiles, fullHashes);
  console.log(`  Takeout: ${takeoutDeduped.unique.length} unicos, ${takeoutDeduped.dupes.length} duplicados internos`);
  for (const d of takeoutDeduped.dupes.slice(0, 5)) {
    console.log(`    DUPE: ${d.file.filename} — ${d.reason}`);
  }
  if (takeoutDeduped.dupes.length > 5) console.log(`    ... y ${takeoutDeduped.dupes.length - 5} mas`);

  const mobileDeduped = dedupeWithinSource(mobileFiles, fullHashes);
  console.log(`  Movil:   ${mobileDeduped.unique.length} unicos, ${mobileDeduped.dupes.length} duplicados internos`);
  for (const d of mobileDeduped.dupes.slice(0, 3)) {
    console.log(`    DUPE: ${d.file.filename} — ${d.reason}`);
  }
  if (mobileDeduped.dupes.length > 3) console.log(`    ... y ${mobileDeduped.dupes.length - 3} mas`);

  const cross = dedupeCrossSource(takeoutDeduped.unique, mobileDeduped.unique, chunkHashes);
  console.log(`  Cruzado: ${cross.dupes.length} archivos del movil ya estan en Takeout`);
  for (const d of cross.dupes.slice(0, 5)) {
    console.log(`    DUPE: ${d.file.filename} — ${d.reason}`);
  }
  if (cross.dupes.length > 5) console.log(`    ... y ${cross.dupes.length - 5} mas`);

  const mobileFinal = mobileDeduped.unique.filter(f => !cross.matchedMobile.has(f.filePath));
  return [...takeoutDeduped.unique, ...mobileFinal];
}

function printReport(finalFiles) {
  const totalPhotos = finalFiles.filter(f => f.mediaType === 'photo').length;
  const totalVideos = finalFiles.filter(f => f.mediaType === 'video').length;
  const totalSize = finalFiles.reduce((sum, f) => sum + f.size, 0);
  const finalWithDate = finalFiles.filter(f => f.metadata?.dateTaken).length;
  const finalWithGps = finalFiles.filter(f => f.metadata?.latitude != null).length;
  const screenshotCount = finalFiles.filter(f => isLikelyScreenshot(f.filename)).length;

  console.log(`\n=== RESUMEN ===`);
  console.log(`A subir:              ${finalFiles.length}`);
  console.log(`  - Fotos:            ${totalPhotos}`);
  console.log(`  - Videos:           ${totalVideos}`);
  if (screenshotCount > 0) console.log(`  - Posibles capturas: ${screenshotCount}`);
  console.log(`Tamano total:         ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Con fecha:            ${finalWithDate}`);
  console.log(`Con GPS:              ${finalWithGps}\n`);
}

// ─── DISPATCHER ────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (opts.stagedDir) {
    if (!opts.token) {
      console.error('ERROR: --staged requiere --token para autenticarse en la API');
      printHelp();
      process.exit(1);
    }
    await mainFromStaged(opts);
    return;
  }

  if (opts.takeoutDir && opts.mobileDir) {
    const startTime = Date.now();
    const mode = opts.stageDir ? 'STAGING' : (opts.dryRun ? 'DRY-RUN' : 'COMMIT');
    console.log(`\n=== EL BUNKER — Importacion masiva VAULT (${mode}) ===`);
    console.log(`Takeout: ${opts.takeoutDir}`);
    console.log(`Movil:   ${opts.mobileDir}\n`);

    const finalFiles = await mainDirect(opts);

    if (opts.stageDir) {
      await stageFiles(finalFiles, opts.stageDir);
      console.log(`\nSTAGING COMPLETO — ${finalFiles.length} archivos copiados a ${opts.stageDir}`);
      console.log(`Tiempo: ${((Date.now() - startTime) / 1000).toFixed(0)}s\n`);
      return;
    }

    printReport(finalFiles);

    if (opts.dryRun) {
      console.log(`DRY-RUN COMPLETO — no se ha subido nada.`);
      console.log(`Para subir de verdad: usa --commit.`);
      console.log(`Tambien puedes usar --stage <carpeta> para revisar antes de subir.\n`);
      return;
    }

    console.log(`ATENCION: Se van a SUBIR ${finalFiles.length} archivos a produccion.`);
    console.log(`API: ${opts.apiBase}\n`);

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => rl.question("Escribe 'si' para confirmar: ", resolve));
    rl.close();
    if (answer.toLowerCase().trim() !== 'si') {
      console.log('Cancelado.');
      process.exit(0);
    }

    const manifest = await loadManifest(opts.manifestPath);
    const uploadStats = await uploadBatch(finalFiles, opts, manifest);
    await saveManifest(manifest);

    console.log(`\n=== SUBIDA COMPLETA ===`);
    console.log(`Subidos:    ${uploadStats.uploaded}`);
    console.log(`Saltados:   ${uploadStats.skipped} (ya en manifiesto)`);
    console.log(`Fallidos:   ${uploadStats.failed}`);
    console.log(`Tiempo:     ${((Date.now() - startTime) / 1000).toFixed(0)}s\n`);

    if (uploadStats.failed > 0) {
      console.log(`ATENCION: ${uploadStats.failed} archivos fallaron. Re-ejecuta el script.`);
    }
    return;
  }

  console.error('ERROR: Combinacion de argumentos no valida.');
  console.error('Usa: --takeout + --mobile + --token (directo)');
  console.error('  o: --takeout + --mobile + --stage (revision)');
  console.error('  o: --staged + --token (subir desde staging)');
  printHelp();
  process.exit(1);
}

async function mainFromStaged(opts) {
  const startTime = Date.now();
  const stageDir = opts.stagedDir;

  console.log(`\n=== EL BUNKER — Subida desde STAGING ===`);
  console.log(`Carpeta:  ${stageDir}`);
  console.log(`Modo:     ${opts.dryRun ? 'DRY-RUN' : 'COMMIT'}\n`);

  console.log('Cargando manifiesto de staging...');
  let stagingManifest;
  try {
    stagingManifest = await loadStagingManifest(stageDir);
  } catch {
    console.error(`ERROR: No se encontro staging-manifest.json en ${stageDir}`);
    console.error('Ejecuta primero --stage para generar la carpeta de revision.');
    process.exit(1);
  }
  console.log(`  ${Object.keys(stagingManifest).length} entradas en el manifiesto`);

  console.log('Escaneando carpeta de staging...');
  const stagedFiles = await scanStagedDirectory(stageDir);
  console.log(`  ${stagedFiles.length} archivos encontrados (despues de revision manual)`);

  if (!stagedFiles.length) {
    console.log('\nNo quedan archivos en la carpeta de staging. Nada que subir.\n');
    process.exit(0);
  }

  console.log('\nRecalculando hashes y vinculando metadata...');
  const matchedFiles = [];
  const unmatched = [];

  await runPool(stagedFiles, HASH_CONCURRENCY, async (f) => {
    const hash = await computeHash(f.filePath);
    f.hash = hash;
    const meta = stagingManifest[hash];
    if (meta) {
      f.metadata = {
        dateTaken: meta.dateTaken || null,
        latitude: meta.latitude ?? null,
        longitude: meta.longitude ?? null,
        title: meta.title || null,
        description: meta.description || null,
        source: 'staged',
      };
      matchedFiles.push(f);
    } else {
      unmatched.push(f);
    }
  }, (done, total) => {
    if (done % 500 === 0 || done === total) console.log(`  Hash: ${done}/${total}...`);
  });

  console.log(`  ${matchedFiles.length} archivos con metadata del manifiesto`);
  if (unmatched.length > 0) {
    console.log(`  ${unmatched.length} archivos SIN metadata (se omitiran):`);
    for (const f of unmatched) console.log(`    - ${f.filename}`);
  }

  printReport(matchedFiles);

  if (opts.dryRun) {
    console.log(`DRY-RUN COMPLETO — no se ha subido nada.`);
    console.log(`Para subir de verdad: usa --commit.\n`);
    return;
  }

  console.log(`ATENCION: Se van a SUBIR ${matchedFiles.length} archivos a produccion.\n`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => rl.question("Escribe 'si' para confirmar: ", resolve));
  rl.close();
  if (answer.toLowerCase().trim() !== 'si') {
    console.log('Cancelado.');
    process.exit(0);
  }

  const manifest = await loadManifest(opts.manifestPath);
  const uploadStats = await uploadBatch(matchedFiles, opts, manifest);
  await saveManifest(manifest);

  console.log(`\n=== SUBIDA COMPLETA ===`);
  console.log(`Subidos:    ${uploadStats.uploaded}`);
  console.log(`Saltados:   ${uploadStats.skipped} (ya en manifiesto)`);
  console.log(`Fallidos:   ${uploadStats.failed}`);
  console.log(`Tiempo:     ${((Date.now() - startTime) / 1000).toFixed(0)}s\n`);

  if (uploadStats.failed > 0) {
    console.log(`ATENCION: ${uploadStats.failed} archivos fallaron. Re-ejecuta el script.`);
  }
}

main().catch(e => {
  console.error(`\nERROR FATAL: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
