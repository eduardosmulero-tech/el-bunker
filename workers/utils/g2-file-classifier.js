// G2 local file-reference classifier.
// Pure functions only: accepts in-memory rows, never accesses D1, R2, or network.
// The generated SQL is a plan; this module never executes it.

const OWNER_TYPES = new Set(["entry", "track"]);
const SOURCES = new Set(["files_fk", "entry_content_json", "track_field"]);
const MAX_SOURCE_PATH = 128;

function requiredString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value;
}

function parseJson(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function addReference(map, ownerType, ownerId, source, sourcePath, fileId = null) {
  if (!OWNER_TYPES.has(ownerType) || !ownerId) return;
  const key = `${ownerType}:${ownerId}`;
  if (!map.has(key)) {
    map.set(key, {
      ownerType,
      ownerId,
      references: [],
    });
  }
  const owner = map.get(key);
  const referenceKey = `${source}:${sourcePath}`;
  if (!owner.references.some(reference => reference.key === referenceKey)) {
    owner.references.push({
      key: referenceKey,
      fileId,
      ownerType,
      ownerId,
      source,
      sourcePath,
    });
  }
}

function extractEntryReferences(entry, fileKey, owners) {
  const content = parseJson(entry.content);
  const images = content?.images;
  if (!Array.isArray(images)) return;

  images.forEach((image, index) => {
    if (image?.r2_key !== fileKey) return;
    addReference(
      owners,
      "entry",
      entry.id,
      "entry_content_json",
      `content.images[${index}].r2_key`,
      null,
    );
  });
}

function extractTrackReferences(track, fileKey, owners) {
  if (track.r2_key === fileKey) {
    addReference(owners, "track", track.id, "track_field", "r2_key", null);
  }
  if (track.thumbnail === fileKey) {
    addReference(owners, "track", track.id, "track_field", "thumbnail", null);
  }
}

function stableReferenceId(reference) {
  const canonical = JSON.stringify([
    reference.fileId,
    reference.ownerType,
    reference.ownerId,
    reference.source,
    reference.sourcePath,
  ]);
  const id = `g2fr_${encodeURIComponent(canonical)}`;
  if (id.length > 256) throw new RangeError("generated reference id is too long");
  return id;
}

function classifyOne(file, entriesById, tracksById, entries, tracks) {
  const fileId = requiredString(file.id, "file.id");
  const fileKey = requiredString(file.r2_key, "file.r2_key");
  const directOwners = new Map();
  const inferredOwners = new Map();

  if (file.entry_id) {
    if (entriesById.has(file.entry_id)) {
      addReference(directOwners, "entry", file.entry_id, "files_fk", "entry_id", fileId);
    }
  }
  if (file.track_id) {
    if (tracksById.has(file.track_id)) {
      addReference(directOwners, "track", file.track_id, "files_fk", "track_id", fileId);
    }
  }

  for (const entry of entries) extractEntryReferences(entry, fileKey, inferredOwners);
  for (const track of tracks) extractTrackReferences(track, fileKey, inferredOwners);

  // Add the file ID to inferred references after extraction, since JSON/field
  // sources do not need it to locate the match.
  for (const owner of inferredOwners.values()) {
    for (const reference of owner.references) reference.fileId = fileId;
  }

  const directKeys = new Set(directOwners.keys());
  const inferredKeys = new Set(inferredOwners.keys());
  const allKeys = new Set([...directKeys, ...inferredKeys]);
  const hasDanglingDirectOwner = Boolean(
    (file.entry_id && !entriesById.has(file.entry_id)) ||
    (file.track_id && !tracksById.has(file.track_id))
  );
  const directEvidenceMissing = directKeys.size > 0 && inferredKeys.size === 0;
  const directInferenceConflict = (
    directKeys.size > 0 && [...directKeys].some(key => !inferredKeys.has(key))
  ) || (
    directKeys.size > 0 && [...inferredKeys].some(key => !directKeys.has(key))
  );

  const references = [];
  for (const key of allKeys) {
    const direct = directOwners.get(key);
    const inferred = inferredOwners.get(key);
    for (const reference of direct?.references || []) references.push(reference);
    for (const reference of inferred?.references || []) references.push(reference);
  }

  let category = "exact";
  if (hasDanglingDirectOwner || directEvidenceMissing || directInferenceConflict) category = "ambiguous";
  else if (allKeys.size === 0) category = "orphan";
  else if (allKeys.size > 1) category = "shared";

  return {
    category,
    file: {
      id: fileId,
      r2Key: fileKey,
      entryId: file.entry_id || null,
      trackId: file.track_id || null,
    },
    ownerCount: allKeys.size,
    references,
    reasons: [
      ...(hasDanglingDirectOwner ? ["dangling_direct_owner"] : []),
      ...(directEvidenceMissing ? ["missing_inferred_evidence"] : []),
      ...(directInferenceConflict ? ["direct_inference_conflict"] : []),
      ...(allKeys.size > 1 ? ["multiple_owners"] : []),
      ...(allKeys.size === 0 ? ["no_valid_owner"] : []),
    ],
  };
}

/** Classify every file into exactly one safe review category. */
export function classifyFileReferences({ files = [], entries = [], tracks = [] } = {}) {
  if (!Array.isArray(files) || !Array.isArray(entries) || !Array.isArray(tracks)) {
    throw new TypeError("files, entries, and tracks must be arrays");
  }
  const assertUniqueIds = (rows, name) => {
    const ids = rows.map(row => requiredString(row.id, `${name}.id`));
    if (new Set(ids).size !== ids.length) throw new TypeError(`${name} contains duplicate ids`);
  };
  assertUniqueIds(files, "files");
  assertUniqueIds(entries, "entries");
  assertUniqueIds(tracks, "tracks");
  const entriesById = new Map(entries.map(entry => [entry.id, entry]));
  const tracksById = new Map(tracks.map(track => [track.id, track]));
  const result = {
    exact: [],
    shared: [],
    ambiguous: [],
    orphans: [],
  };

  for (const file of files) {
    const candidate = classifyOne(file, entriesById, tracksById, entries, tracks);
    const bucket = candidate.category === "orphan" ? "orphans" : candidate.category;
    result[bucket].push(candidate);
  }
  return result;
}

function validateReference(reference) {
  requiredString(reference.fileId, "reference.fileId");
  requiredString(reference.ownerType, "reference.ownerType");
  requiredString(reference.ownerId, "reference.ownerId");
  requiredString(reference.source, "reference.source");
  if (!OWNER_TYPES.has(reference.ownerType)) throw new TypeError("reference.ownerType is not supported");
  if (!SOURCES.has(reference.source)) throw new TypeError("reference.source is not supported");
  if (reference.ownerType === "entry" && !["files_fk", "entry_content_json"].includes(reference.source)) {
    throw new TypeError("reference source does not match ownerType");
  }
  if (reference.ownerType === "track" && !["files_fk", "track_field"].includes(reference.source)) {
    throw new TypeError("reference source does not match ownerType");
  }
  requiredString(reference.sourcePath, "reference.sourcePath");
  if (reference.sourcePath.length > MAX_SOURCE_PATH) {
    throw new RangeError("reference.sourcePath is too long");
  }
}

function insertPlan(reference) {
  validateReference(reference);
  const id = stableReferenceId(reference);
  return {
    id,
    sql: `INSERT INTO file_references
      (id, file_id, owner_type, owner_id, source, source_path)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    bindings: [
      id,
      reference.fileId,
      reference.ownerType,
      reference.ownerId,
      reference.source,
      reference.sourcePath,
    ],
  };
}

/**
 * Build a parameterized forward/rollback plan for exact candidates only.
 * No SQL statement is executed here.
 */
export function buildExactReferencePlan(classification) {
  const categories = ["exact", "shared", "ambiguous", "orphans"];
  if (!classification || categories.some(category => !Array.isArray(classification[category]))) {
    throw new TypeError("classification must contain all category arrays");
  }
  const exact = classification.exact;
  if (classification.shared.length || classification.ambiguous.length || classification.orphans.length) {
    throw new Error("exact reference plan requires unresolved categories to be reviewed first");
  }

  const up = [];
  for (const candidate of exact) {
    if (candidate.category !== "exact" || candidate.ownerCount !== 1 || !Array.isArray(candidate.references) || candidate.references.length === 0) {
      throw new Error("exact reference plan contains a non-exact candidate");
    }
    for (const reference of candidate.references) up.push(insertPlan(reference));
  }
  const rollback = up.map(plan => ({
    id: plan.id,
    sql: `DELETE FROM file_references
      WHERE file_id = ?1 AND owner_type = ?2 AND owner_id = ?3
        AND source = ?4 AND source_path = ?5`,
    bindings: [plan.bindings[1], plan.bindings[2], plan.bindings[3], plan.bindings[4], plan.bindings[5]],
    executeOnlyWhenInsertChanges: 1,
  }));

  return {
    planType: "g2-exact-reference-plan-v1",
    generatedBy: "g2-file-classifier",
    candidateCount: exact.length,
    referenceCount: up.length,
    up,
    rollback,
  };
}
