import { useCallback, useEffect, useRef, useState } from "react";

const normalizeList = (response) => {
  if (Array.isArray(response)) return { items: response, total: response.length };
  return {
    items: Array.isArray(response?.items) ? response.items : [],
    total: Number(response?.total ?? response?.items?.length ?? 0),
  };
};

export default function useAdminResource(descriptor, {
  client,
  pageSize: requestedPageSize,
  debounceMs = 300,
  onAudit,
} = {}) {
  const pageSize = requestedPageSize ?? descriptor?.pageSize ?? 25;
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQueryState] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSortState] = useState(null);
  const [filters, setFilters] = useState({});
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [mutation, setMutation] = useState({ pending: false, error: null });
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  useEffect(() => {
    let active = true;
    const requestId = ++requestIdRef.current;
    const params = {
      page,
      pageSize,
      q: debouncedQuery,
      ...(sort ? { sort: sort.k, dir: sort.dir } : {}),
      ...filters,
    };
    // Loading/error are intentionally reset at each server query.
    /* eslint-disable react-hooks/set-state-in-effect */
    setStatus("loading");
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    Promise.resolve()
      .then(() => client?.list?.(descriptor?.endpoint, params))
      .then((response) => {
        if (!active || !mountedRef.current || requestId !== requestIdRef.current) return;
        const normalized = normalizeList(response);
        setRows(normalized.items);
        setTotal(normalized.total);
        setStatus("ready");
      })
      .catch((reason) => {
        if (!active || !mountedRef.current || requestId !== requestIdRef.current) return;
        const nextError = reason instanceof Error ? reason : new Error(String(reason));
        setRows([]);
        setTotal(0);
        setError(nextError);
        setStatus("error");
      });
    return () => { active = false; };
  }, [client, descriptor?.endpoint, page, pageSize, debouncedQuery, sort, filters, reloadToken]);

  const setQuery = useCallback((value) => {
    setQueryState(value);
    setPage(1);
  }, []);

  const setSort = useCallback((key) => {
    setSortState((current) => {
      if (!current || current.k !== key) return { k: key, dir: "asc" };
      if (current.dir === "asc") return { k: key, dir: "desc" };
      return null;
    });
    setPage(1);
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }, []);

  const refresh = useCallback(() => setReloadToken((value) => value + 1), []);

  const runMutation = useCallback(async (operation, auditPayload, afterSuccess) => {
    setMutation({ pending: true, error: null });
    try {
      const data = await operation();
      if (afterSuccess) afterSuccess();
      else refresh();
      const result = { ok: true, data };
      onAudit?.({ ...auditPayload, ok: true });
      return result;
    } catch (reason) {
      const nextError = reason instanceof Error ? reason : new Error(String(reason));
      const result = { ok: false, error: nextError };
      setMutation({ pending: false, error: nextError });
      onAudit?.({ ...auditPayload, ok: false, error: nextError });
      return result;
    } finally {
      setMutation((current) => ({ ...current, pending: false }));
    }
  }, [onAudit, refresh]);

  const create = useCallback((data) => runMutation(
    () => client.create(descriptor.endpoint, data),
    { action: "create", resource: descriptor.key },
  ), [client, descriptor.endpoint, descriptor.key, runMutation]);

  const update = useCallback((id, data) => runMutation(
    () => client.update(descriptor.endpoint, id, data),
    { action: "update", resource: descriptor.key, id },
  ), [client, descriptor.endpoint, descriptor.key, runMutation]);

  const remove = useCallback((id) => runMutation(
    () => client.remove(descriptor.endpoint, id),
    { action: "delete", resource: descriptor.key, id },
    () => {
      if (rows.length === 1 && page > 1) setPage((current) => current - 1);
      else refresh();
    },
  ), [client, descriptor.endpoint, descriptor.key, page, refresh, rows.length, runMutation]);

  const runAction = useCallback((name, id, data) => {
    if (name === "delete") return remove(id);
    return runMutation(
      () => client.action(descriptor.endpoint, id, name, data),
      { action: name, resource: descriptor.key, id },
    );
  }, [client, descriptor.endpoint, descriptor.key, remove, runMutation]);

  return {
    rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    pageSize,
    query,
    sort,
    filters,
    setQuery,
    setSort,
    setFilter,
    setPage,
    refresh,
    status,
    error,
    create,
    update,
    remove,
    runAction,
    mutation,
  };
}
