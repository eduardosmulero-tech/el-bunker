import { isAdmin } from "./authorization.js";
import { err } from "./response.js";

export default function requireAdmin(userId) {
  return isAdmin(userId) ? null : err("Forbidden — admin required", 403);
}
