// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildExactReferencePlan,
  classifyFileReferences,
} from "../g2-file-classifier.js";

const baseFiles = [
  { id: "f-exact", r2_key: "vault/photos/exact.jpg", entry_id: "e-exact", track_id: null },
  { id: "f-shared", r2_key: "vault/photos/shared.jpg", entry_id: null, track_id: null },
  { id: "f-ambiguous", r2_key: "vault/photos/ambiguous.jpg", entry_id: "e-one", track_id: null },
  { id: "f-orphan", r2_key: "vault/photos/orphan.jpg", entry_id: null, track_id: null },
  { id: "f-dangling", r2_key: "vault/photos/dangling.jpg", entry_id: "missing-entry", track_id: null },
];

const entries = [
  { id: "e-exact", content: { images: [{ r2_key: "vault/photos/exact.jpg" }] } },
  { id: "e-one", content: { images: [{ r2_key: "vault/photos/ambiguous.jpg" }] } },
  { id: "e-two", content: { images: [{ r2_key: "vault/photos/shared.jpg" }] } },
  { id: "e-three", content: JSON.stringify({ images: [{ r2_key: "vault/photos/shared.jpg" }] }) },
];

const tracks = [
  { id: "t-one", r2_key: "vault/photos/ambiguous.jpg", thumbnail: null },
];

describe("G2 file-reference classifier", () => {
  it("classifies exact, shared, ambiguous, and orphan files exhaustively", () => {
    const classification = classifyFileReferences({ files: baseFiles, entries, tracks });

    expect(classification.exact.map(candidate => candidate.file.id)).toEqual(["f-exact"]);
    expect(classification.shared.map(candidate => candidate.file.id)).toEqual(["f-shared"]);
    expect(classification.ambiguous.map(candidate => candidate.file.id)).toEqual(["f-ambiguous", "f-dangling"]);
    expect(classification.orphans.map(candidate => candidate.file.id)).toEqual(["f-orphan"]);
    expect([
      ...classification.exact,
      ...classification.shared,
      ...classification.ambiguous,
      ...classification.orphans,
    ]).toHaveLength(baseFiles.length);
  });

  it("treats a valid FK without inferred evidence as ambiguous", () => {
    const classification = classifyFileReferences({
      files: [{ id: "f-fk-only", r2_key: "vault/photos/fk-only.jpg", entry_id: "e-only", track_id: null }],
      entries: [{ id: "e-only", content: { images: [] } }],
      tracks: [],
    });

    expect(classification.ambiguous[0].reasons).toContain("missing_inferred_evidence");
    expect(classification.exact).toHaveLength(0);
  });

  it("treats a valid FK with a different inferred owner as ambiguous", () => {
    const classification = classifyFileReferences({
      files: [{ id: "f-conflict", r2_key: "vault/photos/conflict.jpg", entry_id: "e-owner", track_id: null }],
      entries: [
        { id: "e-owner", content: { images: [{ r2_key: "vault/photos/conflict.jpg" }] } },
        { id: "e-other", content: { images: [{ r2_key: "vault/photos/conflict.jpg" }] } },
      ],
      tracks: [],
    });

    expect(classification.ambiguous[0].reasons).toContain("direct_inference_conflict");
  });

  it("extracts JSON and track-field references without mutating fixtures", () => {
    const input = JSON.parse(JSON.stringify({ files: baseFiles, entries, tracks }));
    const before = JSON.stringify(input);
    const classification = classifyFileReferences(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(classification.ambiguous[0].reasons).toContain("direct_inference_conflict");
  });

  it("does not create a forward plan while unresolved categories exist", () => {
    const classification = classifyFileReferences({ files: baseFiles, entries, tracks });

    expect(() => buildExactReferencePlan(classification)).toThrow("unresolved categories");
  });

  it("creates parameterized forward and rollback statements only for exact references", () => {
    const exactOnly = classifyFileReferences({
      files: [baseFiles[0]],
      entries: [entries[0]],
      tracks: [],
    });
    const plan = buildExactReferencePlan(exactOnly);

    expect(plan.candidateCount).toBe(1);
    expect(plan.referenceCount).toBe(2);
    expect(plan.up).toHaveLength(2);
    expect(plan.rollback).toHaveLength(2);
    expect(plan.up[0].sql).toContain("INSERT INTO file_references");
    expect(plan.up[0].bindings[1]).toBe("f-exact");
    expect(plan.rollback[0].sql).toContain("DELETE FROM file_references");
    expect(plan.rollback[0].sql).toContain("file_id = ?1 AND owner_type = ?2");
    expect(plan.rollback[0].bindings).toEqual(plan.up[0].bindings.slice(1));
    expect(buildExactReferencePlan(exactOnly).up.map(item => item.id)).toEqual(plan.up.map(item => item.id));
  });

  it("rejects malformed classification instead of producing unsafe SQL", () => {
    expect(() => buildExactReferencePlan({ exact: "not-an-array" })).toThrow("all category arrays");
    expect(() => buildExactReferencePlan({
      exact: [{ category: "exact", ownerCount: 1, references: [{ fileId: "f", ownerType: "entry", ownerId: "e", source: "entry_content_json", sourcePath: "x".repeat(129) }] }],
      shared: [],
      ambiguous: [],
      orphans: [],
    })).toThrow("sourcePath is too long");
    expect(() => buildExactReferencePlan({
      exact: [{ category: "exact", ownerCount: 1, references: [{ fileId: "f", ownerType: "playlist", ownerId: "p", source: "manual", sourcePath: "x" }] }],
      shared: [],
      ambiguous: [],
      orphans: [],
    })).toThrow("ownerType is not supported");
    expect(() => buildExactReferencePlan({
      exact: [{ category: "exact", ownerCount: 1, references: [{ fileId: "f", ownerType: "entry", ownerId: "e", source: "manual", sourcePath: "x" }] }],
      shared: [],
      ambiguous: [],
      orphans: [],
    })).toThrow("source is not supported");
    expect(() => buildExactReferencePlan({
      exact: [{ category: "exact", ownerCount: 1, references: [{ fileId: "f", ownerType: "entry", ownerId: "e", source: "track_field", sourcePath: "x" }] }],
      shared: [],
      ambiguous: [],
      orphans: [],
    })).toThrow("source does not match ownerType");
    expect(() => buildExactReferencePlan({
      exact: [{ category: "exact", ownerCount: 1, references: [{ fileId: "f".repeat(300), ownerType: "entry", ownerId: "e", source: "files_fk", sourcePath: "entry_id" }] }],
      shared: [],
      ambiguous: [],
      orphans: [],
    })).toThrow("generated reference id is too long");
    expect(() => buildExactReferencePlan({
      exact: [{ category: "shared", ownerCount: 2, references: [{ fileId: "f", ownerType: "entry", ownerId: "e", source: "files_fk", sourcePath: "entry_id" }] }],
      shared: [],
      ambiguous: [],
      orphans: [],
    })).toThrow("non-exact candidate");
    expect(() => buildExactReferencePlan({ exact: [], shared: [], ambiguous: [] })).toThrow("all category arrays");
  });

  it("keeps stable IDs deterministic and rejects duplicate fixture IDs", () => {
    const exactOnly = classifyFileReferences({ files: [baseFiles[0]], entries: [entries[0]], tracks: [] });
    const first = buildExactReferencePlan(exactOnly);
    const second = buildExactReferencePlan(exactOnly);
    expect(first.up.map(item => item.id)).toEqual(second.up.map(item => item.id));
    expect(() => classifyFileReferences({ files: [baseFiles[0], baseFiles[0]], entries: [entries[0]], tracks: [] })).toThrow("duplicate ids");
  });
});
