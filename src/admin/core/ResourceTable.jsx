import Card from "../../core/ui/Card";
import Button from "../../core/ui/Button";
import Input from "../../core/ui/Input";
import Icon from "../../core/ui/Icon";
import Skeleton from "../../core/ui/Skeleton";
import { ACID, RED, FONT_MONO } from "../../tokens";

const CELL_RENDERERS = {
  text: (value) => (value ?? "") === "" ? "—" : String(value),
  number: (value) => (value == null ? "—" : Number(value).toLocaleString("es-ES")),
  date: (value) => (value ? new Date(value).toLocaleDateString("es-ES") : "—"),
  lock: (value) => <Icon name={value ? "lock" : "unlock"} size={13} label={value ? "SÍ" : "NO"} />,
  badge: (value, _row, accentColor) => (
    <span style={{ color: accentColor, border: `1px solid ${accentColor}44`, padding: "3px 6px", fontSize: 9 }}>
      {String(value ?? "—")}
    </span>
  ),
};

const normalizeOptions = (options = []) => options.map((option) => (
  typeof option === "object" ? option : { value: option, label: option }
));

export default function ResourceTable({
  columns,
  rows,
  idKey = "id",
  status = "ready",
  error = null,
  query = "",
  onQueryChange = null,
  sort = null,
  onSortChange = null,
  filters = {},
  onFilterChange = null,
  page = 1,
  pageCount = 1,
  total = 0,
  onPageChange = null,
  actions = [],
  onAction = null,
  onRowClick = null,
  selectedIds = null,
  onSelectionChange = null,
  accentColor = ACID,
  emptyLabel = "SIN REGISTROS",
}) {
  const selectable = Boolean(onSelectionChange);
  const allSelected = selectable && rows.length > 0 && rows.every((row) => selectedIds?.includes(row[idKey]));
  const toggleAll = () => {
    const pageIds = rows.map((row) => row[idKey]);
    onSelectionChange(allSelected
      ? (selectedIds ?? []).filter((id) => !pageIds.includes(id))
      : [...new Set([...(selectedIds ?? []), ...pageIds])]);
  };
  const toggleOne = (id) => {
    const current = selectedIds ?? [];
    onSelectionChange(current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const renderCell = (column, row) => {
    const value = row[column.k];
    if (typeof column.render === "function") return column.render(value, row);
    const renderer = CELL_RENDERERS[column.render] ?? CELL_RENDERERS.text;
    return renderer(value, row, accentColor);
  };

  return (
    <Card accentColor={accentColor} padding="sm">
      <div className="flex flex-wrap items-end gap-2" style={{ marginBottom: 10 }}>
        {onQueryChange && columns.some((column) => column.search) && (
          <div style={{ minWidth: 220, flex: "1 1 220px" }}>
            <Input value={query} onChange={(event) => onQueryChange(event.target.value)} label="BUSCAR" aria-label="BUSCAR" accentColor={accentColor} />
          </div>
        )}
        {onFilterChange && columns.filter((column) => column.filter).map((column) => (
          <label key={column.k} className="flex flex-col gap-1" style={{ minWidth: 130, color: `${accentColor}88`, fontSize: 10, letterSpacing: "0.2em" }}>
            {column.label ?? column.k.toUpperCase()}
            {column.options ? (
              <select value={filters[column.k] ?? ""} onChange={(event) => onFilterChange(column.k, event.target.value)} aria-label={column.label ?? column.k} style={{ minHeight: 44, color: accentColor, background: "transparent", border: `1px solid ${accentColor}33`, fontFamily: FONT_MONO }}>
                <option value="">TODOS</option>
                {normalizeOptions(column.options).map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
              </select>
            ) : <Input value={filters[column.k] ?? ""} onChange={(event) => onFilterChange(column.k, event.target.value)} aria-label={column.label ?? column.k} accentColor={accentColor} />}
          </label>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 560, width: "100%", borderCollapse: "collapse", color: accentColor, fontFamily: FONT_MONO }}>
          <thead>
            <tr>
              {selectable && <th scope="col" style={{ width: 48, textAlign: "center" }}><button type="button" role="checkbox" aria-checked={allSelected} aria-label="SELECCIONAR TODO" onClick={toggleAll} style={{ minWidth: 44, minHeight: 44, color: accentColor, background: "transparent", border: 0 }}>{allSelected ? "[x]" : "[ ]"}</button></th>}
              {columns.map((column) => (
                <th key={column.k} scope="col" style={{ textAlign: "left", padding: "10px 8px", borderBottom: `1px solid ${accentColor}33`, fontSize: 10, letterSpacing: "0.15em" }}>
                  {column.sort && onSortChange ? (
                    <button type="button" aria-sort={sort?.k === column.k ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} onClick={() => onSortChange(column.k)} style={{ color: accentColor, background: "transparent", border: 0, minHeight: 44, padding: 0, font: "inherit", cursor: "pointer" }}>
                      {column.label ?? column.k.toUpperCase()} {sort?.k === column.k && <Icon name={sort.dir === "asc" ? "arrowUp" : "arrowDown"} size={12} decorative />}
                    </button>
                  ) : (column.label ?? column.k.toUpperCase())}
                </th>
              ))}
              {actions.length > 0 && <th scope="col" style={{ padding: "10px 8px", borderBottom: `1px solid ${accentColor}33` }}>ACCIONES</th>}
            </tr>
          </thead>
          <tbody>
            {status === "loading" && Array.from({ length: Math.min(8, rows.length || 8) }).map((_, index) => (
              <tr key={`loading-${index}`}><td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length ? 1 : 0)} style={{ padding: 8 }}><Skeleton.Block height={12} /></td></tr>
            ))}
            {status === "error" && <tr><td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length ? 1 : 0)}><span className="flex items-center gap-2" style={{ padding: 16, color: RED }}><Icon name="alert" size={14} decorative />{error?.message ?? "ERROR DE CARGA"}</span></td></tr>}
            {status === "ready" && rows.length === 0 && <tr><td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length ? 1 : 0)} style={{ padding: 24, textAlign: "center", color: `${accentColor}88` }}>{emptyLabel}</td></tr>}
            {status === "ready" && rows.map((row) => (
              <tr key={row[idKey]} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? "pointer" : undefined, borderBottom: `1px solid ${accentColor}12` }}>
                {selectable && <td onClick={(event) => event.stopPropagation()} style={{ textAlign: "center" }}><button type="button" role="checkbox" aria-checked={selectedIds?.includes(row[idKey]) ?? false} aria-label={`SELECCIONAR ${row[idKey]}`} onClick={() => toggleOne(row[idKey])} style={{ minWidth: 44, minHeight: 44, color: accentColor, background: "transparent", border: 0 }}>{selectedIds?.includes(row[idKey]) ? "[x]" : "[ ]"}</button></td>}
                {columns.map((column) => <td key={column.k} style={{ padding: "8px", fontSize: 11 }}>{renderCell(column, row)}</td>)}
                {actions.length > 0 && <td onClick={(event) => event.stopPropagation()} style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>{actions.map((action) => <Button key={action.name} size="sm" variant="ghost" accentColor={action.tone === "danger" ? RED : accentColor} icon={<Icon name={action.icon} size={13} decorative />} title={action.label} onClick={() => onAction?.(action.name, row)}>{action.label}</Button>)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange && <div className="flex items-center justify-between gap-2" style={{ marginTop: 10 }}>
        <Button size="sm" variant="ghost" accentColor={accentColor} icon={<Icon name="chevronLeft" size={14} decorative />} title="Página anterior" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>ANTERIOR</Button>
        <span style={{ fontSize: 10, color: `${accentColor}aa`, letterSpacing: "0.1em", textAlign: "center" }}>PÁGINA {page} / {pageCount} · {total} REGISTROS</span>
        <Button size="sm" variant="ghost" accentColor={accentColor} icon={<Icon name="chevronRight" size={14} decorative />} title="Página siguiente" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>SIGUIENTE</Button>
      </div>}
    </Card>
  );
}
