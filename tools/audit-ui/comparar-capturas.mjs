// tools/audit-ui/comparar-capturas.mjs
// Comparación pixel a pixel de dos PNG sin dependencias externas: decodifica
// ambos PNG con zlib nativo de Node (filtros PNG estándar) y cuenta
// diferencias por canal con tolerancia configurable. Genera además un mapa
// de diferencias (rojo) sobre una de las dos imágenes.
// Uso: node tools/audit-ui/comparar-capturas.mjs <a.png> <b.png> [--tolerancia=8] [--diff-out=ruta.png]
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Decodifica PNG de 8 bits, RGB/RGBA/paletado, con todos los filtros por fila.
export function decodePng(file) {
  const buf = readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} no es un PNG`);
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  let palette = null, trns = null, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
      if (bitDepth !== 8) throw new Error(`${file}: profundidad ${bitDepth} no soportada (solo 8 bits)`);
      if (![2, 3, 6].includes(colorType)) throw new Error(`${file}: colorType ${colorType} no soportado (RGB, paleta o RGBA)`);
    } else if (type === "PLTE") palette = Buffer.from(data);
    else if (type === "tRNS") trns = Buffer.from(data);
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : 1;
  const bpp = channels;
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(stride * height);
  const prevRow = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0;
      const b = prevRow[i];
      const c = i >= bpp ? prevRow[i - bpp] : 0;
      let v = row[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += Math.floor((a + b) / 2);
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[i] = v & 0xff;
    }
    prevRow.set(out);
  }
  // Normalizar a RGBA
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    if (colorType === 2) { rgba[i*4] = pixels[i*3]; rgba[i*4+1] = pixels[i*3+1]; rgba[i*4+2] = pixels[i*3+2]; rgba[i*4+3] = 255; }
    else if (colorType === 6) { rgba[i*4] = pixels[i*4]; rgba[i*4+1] = pixels[i*4+1]; rgba[i*4+2] = pixels[i*4+2]; rgba[i*4+3] = pixels[i*4+3]; }
    else {
      const idx = pixels[i];
      rgba[i*4] = palette[idx*3]; rgba[i*4+1] = palette[idx*3+1]; rgba[i*4+2] = palette[idx*3+2];
      rgba[i*4+3] = trns && idx < trns.length ? trns[idx] : 255;
    }
  }
  return { width, height, rgba };
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function comparar(aPath, bPath, { tolerancia = 8, diffOut = null } = {}) {
  const a = decodePng(aPath), b = decodePng(bPath);
  if (a.width !== b.width || a.height !== b.height) {
    return { iguales: false, motivo: `dimensiones distintas: ${a.width}x${a.height} vs ${b.width}x${b.height}`, diffPx: -1, totalPx: a.width * a.height };
  }
  let diffPx = 0;
  const diff = diffOut ? Buffer.from(a.rgba) : null;
  for (let i = 0; i < a.rgba.length; i += 4) {
    const dr = Math.abs(a.rgba[i] - b.rgba[i]);
    const dg = Math.abs(a.rgba[i+1] - b.rgba[i+1]);
    const db = Math.abs(a.rgba[i+2] - b.rgba[i+2]);
    if (dr > tolerancia || dg > tolerancia || db > tolerancia) {
      diffPx++;
      if (diff) { diff[i] = 255; diff[i+1] = 0; diff[i+2] = 0; diff[i+3] = 255; }
    }
  }
  if (diffOut) writeFileSync(diffOut, encodePng(a.width, a.height, diff));
  const totalPx = a.width * a.height;
  return { iguales: diffPx === 0, diffPx, totalPx, porcentaje: +(100 * diffPx / totalPx).toFixed(4), width: a.width, height: a.height };
}

// CLI
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const files = args.filter((x) => !x.startsWith("--"));
  const opt = Object.fromEntries(args.filter((x) => x.startsWith("--")).map((x) => {
    const [k, v] = x.slice(2).split("=");
    return [k, v === undefined ? true : v];
  }));
  if (files.length < 2) { console.error("Uso: node comparar-capturas.mjs <a.png> <b.png> [--tolerancia=8] [--diff-out=ruta.png]"); process.exit(2); }
  const res = comparar(files[0], files[1], { tolerancia: Number(opt.tolerancia ?? 8), diffOut: opt["diff-out"] ?? null });
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.iguales ? 0 : 1);
}
