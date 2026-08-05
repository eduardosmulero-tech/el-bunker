import { err } from "../utils/response.js";
import requireAdmin from "../utils/require-admin.js";

export default async function handleAdmin(request, env, url, userId) {
  const denied = requireAdmin(userId);
  if (denied) return denied;

  if (!url.pathname.startsWith("/api/admin/")) return err("Not found", 404);
  return err("Admin route not implemented", 404);
}
