import { useState } from "react";
import { motion } from "framer-motion";
import Icon from "../../core/ui/Icon";
import { ACID, BG, FONT_MONO } from "../../tokens";
import ResourceConsole from "./ResourceConsole";

export default function AdminShell({
  resources = [],
  client,
  title = "TERMINAL DE MANDO",
  activeKey = null,
  onActiveKeyChange = null,
  user = null,
  accentColor = ACID,
  onAudit = null,
  footer = null,
}) {
  const [internalKey, setInternalKey] = useState(resources[0]?.key ?? null);
  const selectedKey = activeKey ?? internalKey;
  const active = resources.find((resource) => resource.key === selectedKey) ?? resources[0] ?? null;
  const choose = (key) => {
    if (activeKey == null) setInternalKey(key);
    onActiveKeyChange?.(key);
  };
  const resourceButton = (resource) => (
    <button key={resource.key} type="button" aria-current={resource.key === active?.key ? "page" : undefined} onClick={() => choose(resource.key)} style={{ minHeight: 44, padding: "0 12px", display: "flex", alignItems: "center", gap: 8, color: resource.key === active?.key ? accentColor : `${accentColor}88`, background: "transparent", border: 0, borderLeft: `2px solid ${resource.key === active?.key ? accentColor : "transparent"}`, fontFamily: FONT_MONO, letterSpacing: "0.16em", fontSize: 10, whiteSpace: "nowrap", cursor: "pointer" }}>
      <Icon name={resource.icon ?? "document"} size={14} decorative />{resource.label}
    </button>
  );

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: accentColor, fontFamily: FONT_MONO }}>
      <header className="flex items-center justify-between gap-3" style={{ minHeight: 64, padding: "12px 16px", borderBottom: `1px solid ${accentColor}22` }}>
        <div style={{ letterSpacing: "0.3em", fontSize: 12 }}><span>{title}</span>{active && <span> · {active.label}</span>}</div>
        {user?.id && <div style={{ color: `${accentColor}88`, fontSize: 10 }}>{user.id}</div>}
      </header>
      {resources.length > 0 && <nav className="flex md:hidden" style={{ overflowX: "auto", borderBottom: `1px solid ${accentColor}18` }}>{resources.map(resourceButton)}</nav>}
      <div className="flex">
        {resources.length > 0 && <aside className="hidden md:flex" style={{ width: 210, minHeight: "calc(100dvh - 64px)", flexDirection: "column", gap: 4, padding: "16px 0", borderRight: `1px solid ${accentColor}18` }}>{resources.map(resourceButton)}</aside>}
        <main style={{ flex: 1, minWidth: 0, padding: 16 }}>
          {active ? <motion.div key={active.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ResourceConsole descriptor={active} client={client} accentColor={accentColor} onAudit={onAudit} /></motion.div> : <div className="flex items-center gap-2" style={{ padding: 24, color: `${accentColor}88`, fontSize: 11 }}><Icon name="alert" size={15} decorative />SIN RECURSOS CONFIGURADOS</div>}
        </main>
      </div>
      {footer}
    </div>
  );
}
