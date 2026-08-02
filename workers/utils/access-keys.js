// ============================================================
//  EL BÚNKER — workers/utils/access-keys.js
//  Claves de acceso test/admin (ADR-028).
//  Se canjean por JWT en POST /api/auth/token. NO son un bypass
//  de authenticate(): solo alimentan al emisor de JWT.
// ============================================================

/** Longitud mínima de una clave (32 chars ≈ 192 bits en base64url). */
export const MIN_KEY_LENGTH = 32;

/** Secret del worker → usuario de la whitelist (ADR-006). Sin entrada para david. */
export const ACCESS_KEY_BINDINGS = [
  { secret: "ADMIN_ACCESS_KEY", userId: "admin" },
  { secret: "EDU_ACCESS_KEY",   userId: "edu"   },
];

/** SHA-256 en hex. Siempre 64 chars → la comparación no filtra la longitud real. */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparación en tiempo constante de dos digests hex. */
function constantTimeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** ¿Hay al menos una clave configurada? Sirve para distinguir 401 (mala) de 503 (sin configurar). */
export function hasAccessKeysConfigured(env) {
  return ACCESS_KEY_BINDINGS.some(({ secret }) => {
    const value = env?.[secret];
    return typeof value === "string" && value.length >= MIN_KEY_LENGTH;
  });
}

/**
 * resolveAccessKey — userId de la clave presentada, o null.
 * Recorre TODOS los bindings sin cortocircuito: el tiempo de respuesta no
 * revela cuál acertó ni cuántas claves hay configuradas.
 */
export async function resolveAccessKey(key, env) {
  if (typeof key !== "string" || key.length < MIN_KEY_LENGTH) return null;
  const presented = await sha256Hex(key);
  let match = null;
  for (const { secret, userId } of ACCESS_KEY_BINDINGS) {
    const configured = env?.[secret];
    if (typeof configured !== "string" || configured.length < MIN_KEY_LENGTH) continue;
    const expected = await sha256Hex(configured);
    if (constantTimeEqualHex(presented, expected)) match = userId;
  }
  return match;
}
