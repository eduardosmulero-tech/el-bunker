// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { workerClient } from "../WorkerClient.js";
import { uploadFile } from "../FileUploadService.js";

describe("FileUploadService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    workerClient.clearToken();
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: true },
    });
  });

  it("sends the file MIME type on the binary PUT", async () => {
    workerClient.setToken("jwt");
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: true },
    });
    const post = vi.spyOn(workerClient, "post").mockResolvedValue({
      r2_key: "music/song.mp3",
      file_id: "file-1",
    });
    const fetch = vi.spyOn(workerClient, "fetch").mockResolvedValue(
      new Response(null, { status: 201 }),
    );
    const del = vi.spyOn(workerClient, "del");
    const file = { name: "song.mp3", type: "audio/mpeg", size: 3 };

    await expect(uploadFile(file, "music", { track_id: "track-1" })).resolves.toEqual({
      r2_key: "music/song.mp3",
      file_id: "file-1",
    });

    expect(post).toHaveBeenCalledWith("/api/upload", expect.objectContaining({
      prefix: "music",
      filename: "song.mp3",
      mime_type: "audio/mpeg",
      track_id: "track-1",
    }));
    expect(fetch).toHaveBeenCalledWith("/api/upload/music%2Fsong.mp3", {
      method: "PUT",
      headers: { "Content-Type": "audio/mpeg" },
      body: file,
    });
    expect(del).not.toHaveBeenCalled();
  });
});
