// @vitest-environment node
import { describe, it, expect } from "vitest";
import { checkAuthRateLimit } from "../rate-limit.js";

const req = (ip) => new Request("https://x/api/auth/token", { headers: { "CF-Connecting-IP": ip } });

describe("checkAuthRateLimit", () => {
  it("permite 10 intentos por IP y bloquea el 11º", () => {
    const r = req("1.2.3.4");
    for (let i = 0; i < 10; i++) expect(checkAuthRateLimit(r)).toBe(true);
    expect(checkAuthRateLimit(r)).toBe(false);
  });

  it("cuenta por IP de forma independiente", () => {
    const otra = req("5.6.7.8");
    expect(checkAuthRateLimit(otra)).toBe(true);
  });
});
