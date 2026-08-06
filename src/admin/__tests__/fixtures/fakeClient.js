// Cliente en memoria con la misma firma que createApiClient(). El client de
// admin-core es inyectable justamente para esto: los tests no mockean fetch.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createFakeClient(seedRows = [], options = {}) {
  const { idKey = "id", listDelays = [], failures = {} } = options;
  let rows = seedRows.map((row) => ({ ...row }));
  let nextId = rows.length + 1;
  let listCalls = 0;
  const calls = [];

  const record = (name, args) => {
    calls.push({ name, ...args });
  };

  const fail = (name) => {
    const error = failures[name];
    if (error) throw error instanceof Error ? error : new Error(String(error));
  };

  return {
    calls,
    callsOf: (name) => calls.filter((call) => call.name === name),
    snapshot: () => rows.map((row) => ({ ...row })),

    list: async (endpoint, params = {}) => {
      const index = listCalls++;
      record("list", { endpoint, params });
      const delay = listDelays[index];
      if (delay) await sleep(delay);
      fail("list");

      const { page = 1, pageSize = 25, q = "", sort, dir = "asc", ...filters } = params;
      let out = rows;

      if (q) {
        const needle = String(q).toLowerCase();
        out = out.filter((row) =>
          Object.values(row).some(
            (value) => typeof value === "string" && value.toLowerCase().includes(needle)
          )
        );
      }
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === "") continue;
        out = out.filter((row) => String(row[key]) === String(value));
      }
      if (sort) {
        out = [...out].sort((a, b) => String(a[sort] ?? "").localeCompare(String(b[sort] ?? "")));
        if (dir === "desc") out.reverse();
      }

      const total = out.length;
      const start = (Number(page) - 1) * Number(pageSize);
      return { items: out.slice(start, start + Number(pageSize)), total };
    },

    create: async (endpoint, data) => {
      record("create", { endpoint, data });
      fail("create");
      const row = { [idKey]: `w${nextId++}`, ...data };
      rows = [...rows, row];
      return row;
    },

    update: async (endpoint, id, data) => {
      record("update", { endpoint, id, data });
      fail("update");
      rows = rows.map((row) => (row[idKey] === id ? { ...row, ...data } : row));
      return rows.find((row) => row[idKey] === id) ?? null;
    },

    remove: async (endpoint, id) => {
      record("remove", { endpoint, id });
      fail("remove");
      rows = rows.filter((row) => row[idKey] !== id);
      return null;
    },

    action: async (endpoint, id, name, data) => {
      record("action", { endpoint, id, action: name, data });
      fail("action");
      return { ok: true };
    },
  };
}

export function makeRows(count, prefix = "Widget") {
  return Array.from({ length: count }, (_, i) => ({
    id: `w${i + 1}`,
    name: `${prefix} ${String(i + 1).padStart(2, "0")}`,
    kind: i % 2 === 0 ? "a" : "b",
    notes: "",
    locked: false,
  }));
}
