// ============================================================
//  EL BÚNKER — workers/routes/auth.js
//  POST /api/auth/login — verifica Google token, emite JWT
// ============================================================

import { WHITELIST } from "../config.js";
import { json, err } from "../utils/response.js";
import { signJWT } from "../utils/auth.js";

export default async function handleAuth(request, env) {
  if (request.method !== "POST") return err("Method not allowed", 405);

  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.google_token) {
    return err("email and google_token required", 400);
  }

  // Verificar Google token contra Google API
  const gRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(body.google_token)}`
  );
  if (!gRes.ok) return err("Invalid Google token", 401);

  const gData = await gRes.json();
  const verifiedEmail = gData.email?.toLowerCase();
  if (!WHITELIST[verifiedEmail]) return err("Email not authorized", 403);

  const secret = env.JWT_SECRET;
  if (!secret && env.ENVIRONMENT === "production") {
    return err("JWT_SECRET not configured", 500);
  }

  const token = await signJWT(
    { sub: WHITELIST[verifiedEmail], email: verifiedEmail },
    secret || "dev-secret-change-me"
  );

  return json({
    token,
    user: { id: WHITELIST[verifiedEmail], email: verifiedEmail },
  });
}
