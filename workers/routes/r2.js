// ============================================================
//  EL BÚNKER — workers/routes/r2.js
//  Fallback: servir archivos binarios públicos desde R2
//  GET /:r2_key (sin /api/ prefix)
// ============================================================

import { CORS_HEADERS } from "../config.js";
import { err } from "../utils/response.js";
import { isSensitiveR2Key, verifyR2Read } from "../utils/r2-sign.js";

/**
 * Parse a single RFC 7233 byte range against a known object size.
 * Returns an R2 range or null when the header is malformed/unsatisfiable.
 * Multiple ranges are intentionally rejected because this endpoint returns
 * one stream and does not implement multipart/byteranges.
 */
export function parseByteRange(header, size) {
  if (typeof header !== "string" || !Number.isSafeInteger(size) || size < 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size === 0) return null;

  const [, startText, endText] = match;
  if (!startText && !endText) return null;

  if (!startText) {
    const suffixLength = Number(endText);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    const length = Math.min(suffixLength, size);
    return { offset: size - length, length };
  }

  const offset = Number(startText);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= size) return null;
  const requestedEnd = endText ? Number(endText) : size - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < offset) return null;
  const end = Math.min(requestedEnd, size - 1);
  return { offset, length: end - offset + 1 };
}

function rangeHeader(range, size) {
  return `bytes ${range.offset}-${range.offset + range.length - 1}/${size}`;
}

export default async function handleR2(request, env, path) {
  if (request.method !== "GET") return err("Method not allowed", 405);

  const r2_key = path.slice(1); // quitar / inicial
  if (!r2_key) return err("Not found", 404);

  // FASE D.1: gate HMAC para prefijos sensibles.
  if (env?.R2_SIGN_SECRET && isSensitiveR2Key(r2_key)) {
    const url = new URL(request.url);
    const token = url.searchParams.get("t");
    const ok = await verifyR2Read(r2_key, token, env);
    if (!ok) return err("Not found", 404); // no revela existencia
  }

  const metadata = await env.BUNKER.head(r2_key);
  if (!metadata) return err("Not found", 404);

  const requestedRange = request.headers.get("Range");
  const range = requestedRange ? parseByteRange(requestedRange, metadata.size) : null;
  if (requestedRange && !range) {
    return new Response(null, {
      status: 416,
      headers: {
        ...CORS_HEADERS,
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes */${metadata.size}`,
      },
    });
  }

  const obj = await env.BUNKER.get(r2_key, range ? { range } : undefined);
  if (!obj) return err("Not found", 404);

  const headers = new Headers(CORS_HEADERS);
  if (typeof obj.writeHttpMetadata === "function") obj.writeHttpMetadata(headers);
  headers.set("Content-Type", obj.httpMetadata?.contentType || metadata.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Content-Length", String(range ? range.length : metadata.size));
  headers.set("Accept-Ranges", "bytes");
  if (obj.httpEtag || metadata.httpEtag) headers.set("ETag", obj.httpEtag || metadata.httpEtag);
  if (range) headers.set("Content-Range", rangeHeader(range, metadata.size));

  return new Response(obj.body, {
    status: range ? 206 : 200,
    headers,
  });
}
