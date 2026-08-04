// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyJwt,
  clearSession,
  persistAccessSession,
  readAccessSession,
  readStoredJwt,
  setSessionKind,
} from "../SessionBridge.js";

const makeStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
};

describe("SessionBridge", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("reads the stored JWT without owning React state", () => {
    sessionStorage.setItem("bunker_jwt", "jwt-1");
    expect(readStoredJwt()).toBe("jwt-1");
  });

  it("persists and restores an access-key session without exposing the key in session user data", () => {
    const session = makeStorage();
    const local = makeStorage();
    const user = { id: "admin", role: "admin", name: "Admin" };

    persistAccessSession(user, "secret-key", { session, local });
    setSessionKind("access_key", session);

    expect(readAccessSession({ session, local })).toEqual({
      jwt: null,
      kind: "access_key",
      user,
      key: "secret-key",
    });
    expect(session.getItem("bunker_user")).not.toContain("secret-key");
  });

  it("keeps valid session credentials readable when the cached user JSON is corrupt", () => {
    const session = makeStorage();
    const local = makeStorage();
    session.setItem("bunker_jwt", "jwt-valid");
    session.setItem("bunker_session_kind", "access_key");
    session.setItem("bunker_user", "{not-json");
    local.setItem("bunker_access_key", "remembered-key");

    expect(readAccessSession({ session, local })).toEqual({
      jwt: "jwt-valid",
      kind: "access_key",
      user: null,
      key: "remembered-key",
    });
  });

  it("propagates a JWT to React state, WorkerClient and upload/stats services", () => {
    const setJwtToken = vi.fn();
    const workerClient = { setToken: vi.fn() };
    const setUploadToken = vi.fn();
    const setStatsToken = vi.fn();
    const storage = makeStorage();

    applyJwt("jwt-2", { setJwtToken, workerClient, setUploadToken, setStatsToken, storage });

    expect(setJwtToken).toHaveBeenCalledWith("jwt-2");
    expect(workerClient.setToken).toHaveBeenCalledWith("jwt-2");
    expect(setUploadToken).toHaveBeenCalledWith("jwt-2");
    expect(setStatsToken).toHaveBeenCalledWith("jwt-2");
    expect(storage.getItem("bunker_jwt")).toBe("jwt-2");
  });

  it("does not persist a null JWT", () => {
    const storage = makeStorage();
    storage.setItem("bunker_jwt", "old-jwt");

    applyJwt(null, { storage });

    expect(storage.getItem("bunker_jwt")).toBeNull();
  });

  it("tolerates storage methods that throw", () => {
    const blockedStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };

    expect(readStoredJwt(blockedStorage)).toBeNull();
    expect(readAccessSession({ session: blockedStorage, local: blockedStorage })).toEqual({
      jwt: null,
      kind: null,
      user: null,
      key: null,
    });
    expect(() => applyJwt("jwt", { storage: blockedStorage })).not.toThrow();
    expect(() => clearSession({ session: blockedStorage, local: blockedStorage })).not.toThrow();
  });

  it("clears persisted session and all JWT consumers on logout", () => {
    const session = makeStorage();
    const local = makeStorage();
    session.setItem("bunker_jwt", "jwt-3");
    session.setItem("bunker_session_kind", "access_key");
    session.setItem("bunker_user", JSON.stringify({ id: "admin" }));
    local.setItem("bunker_access_key", "secret-key");
    const workerClient = { clearToken: vi.fn() };
    const setUploadToken = vi.fn();
    const setStatsToken = vi.fn();

    clearSession({ workerClient, setUploadToken, setStatsToken, session, local });

    expect(readAccessSession({ session, local })).toEqual({ jwt: null, kind: null, user: null, key: null });
    expect(workerClient.clearToken).toHaveBeenCalledOnce();
    expect(setUploadToken).toHaveBeenCalledWith(null);
    expect(setStatsToken).toHaveBeenCalledWith(null);
  });
});
