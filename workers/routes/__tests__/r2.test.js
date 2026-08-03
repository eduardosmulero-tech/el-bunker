// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseByteRange } from "../r2.js";

describe("parseByteRange", () => {
  it("parses an inclusive bounded range", () => {
    expect(parseByteRange("bytes=0-9", 100)).toEqual({ offset: 0, length: 10 });
  });

  it("parses an open-ended range", () => {
    expect(parseByteRange("bytes=10-", 100)).toEqual({ offset: 10, length: 90 });
  });

  it("parses a suffix range", () => {
    expect(parseByteRange("bytes=-10", 100)).toEqual({ offset: 90, length: 10 });
  });

  it("clamps a bounded end to the object size", () => {
    expect(parseByteRange("bytes=99-120", 100)).toEqual({ offset: 99, length: 1 });
  });

  it("rejects unsatisfiable, reversed and multipart ranges", () => {
    expect(parseByteRange("bytes=100-", 100)).toBeNull();
    expect(parseByteRange("bytes=10-9", 100)).toBeNull();
    expect(parseByteRange("bytes=0-0,2-3", 100)).toBeNull();
  });
});
