// VaultContext — claim `visit` del JWT (Modo Visita, A5 / diseño §5).
// El modo visita vive en el JWT, no en localStorage: el servidor lo emite
// (POST /api/session/visit) y el cliente solo lee el payload para pintar el
// interruptor. decodeJwtPayload es la única pieza pura testeable sin red.
import { describe, expect, it } from "vitest";
import { decodeJwtPayload } from "../VaultContext";

const b64url = (obj) =>
  btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeJwt = (payload) =>
  `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.firma-simulada`;

describe("decodeJwtPayload (claim visit)", () => {
  it("lee visit:true del payload de un JWT válido", () => {
    const payload = decodeJwtPayload(makeJwt({ sub: "edu", visit: true, exp: 9999999999 }));
    expect(payload.visit).toBe(true);
    expect(payload.sub).toBe("edu");
  });

  it("visit ausente o false → no es modo visita", () => {
    expect(decodeJwtPayload(makeJwt({ sub: "edu" })).visit).toBeUndefined();
    expect(decodeJwtPayload(makeJwt({ sub: "edu", visit: false })).visit).toBe(false);
  });

  it("tokens rotos o ausentes no lanzan: devuelven null", () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload("")).toBeNull();
    expect(decodeJwtPayload("no-es-un-jwt")).toBeNull();
    expect(decodeJwtPayload("a.b.c")).toBeNull();
  });
});
