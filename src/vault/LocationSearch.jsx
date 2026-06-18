import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, FONT_MONO, PURPLE } from "../tokens";
import { searchLocation } from "./GeocoderService";

export default function LocationSearch({ value, lat, lng, onSelect, onClear }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState(lat ?? "");
  const [manualLng, setManualLng] = useState(lng ?? "");
  const timerRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const res = await searchLocation(query);
      setResults(res);
      setOpen(res.length > 0);
      setLoading(false);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    const close = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handlePick = (r) => {
    setQuery(r.label);
    setOpen(false);
    onSelect({ place_name: r.label, lat: r.lat, lng: r.lng });
  };

  const handleApplyManual = () => {
    const mlat = parseFloat(manualLat);
    const mlng = parseFloat(manualLng);
    if (isNaN(mlat) || isNaN(mlng)) return;
    onSelect({ place_name: manualLat && manualLng ? `${manualLat}, ${manualLng}` : "", lat: mlat, lng: mlng });
    setShowManual(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onClear?.();
  };

  const hasCoords = lat != null && lng != null;

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1" style={{ fontFamily: FONT_MONO }}>
      <div className="flex items-center gap-1">
        <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: ACID, opacity: 0.3 }}>📍 UBICACIÓN</span>
        {hasCoords && (
          <span className="text-[8px] opacity-30 ml-auto" style={{ color: ACID }}>✓ {lat?.toFixed(4)}, {lng?.toFixed(4)}</span>
        )}
      </div>
      <div className="flex gap-1">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar lugar…" autoComplete="off"
          className="bg-transparent text-xs p-3 min-h-[44px] flex-1 outline-none"
          style={{ color: ACID, border: `1px solid ${hasCoords ? `${ACID}55` : `${ACID}33`}`, fontFamily: FONT_MONO }} />
        {query && (
          <button onClick={handleClear} className="text-xs px-3 py-2.5 opacity-30 hover:opacity-60" style={{ color: ACID }}>✕</button>
        )}
        <button onClick={() => setShowManual((p) => !p)} className="text-xs px-3 py-2.5 tracking-widest uppercase opacity-30 hover:opacity-60"
          style={{ color: ACID, border: `1px solid ${ACID}22`, fontFamily: FONT_MONO }}>°°</button>
      </div>

      {loading && <span className="text-[8px] opacity-20 px-1" style={{ color: ACID }}>buscando…</span>}

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-sm overflow-hidden"
            style={{ background: "#0a0a0a", border: `1px solid ${ACID}22`, maxHeight: 200, overflowY: "auto" }}>
            {results.map((r, i) => (
              <div key={i} onClick={() => handlePick(r)}
                className="flex items-center gap-2 px-3 py-3 cursor-pointer text-xs"
                style={{ color: ACID, borderBottom: i < results.length - 1 ? `1px solid ${ACID}0d` : "none" }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${PURPLE}0d`}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span className="opacity-30 text-[9px]">📍</span>
                <span className="truncate flex-1">{r.label}</span>
                <span className="text-[7px] opacity-20">{r.lat.toFixed(3)}, {r.lng.toFixed(3)}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManual && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex gap-1 overflow-hidden">
            <input value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="Latitud" type="number" step="any"
              className="bg-transparent text-xs p-3 min-h-[44px] flex-1 outline-none"
              style={{ color: ACID, border: `1px solid ${ACID}22`, fontFamily: FONT_MONO }} />
            <input value={manualLng} onChange={(e) => setManualLng(e.target.value)} placeholder="Longitud" type="number" step="any"
              className="bg-transparent text-xs p-3 min-h-[44px] flex-1 outline-none"
              style={{ color: ACID, border: `1px solid ${ACID}22`, fontFamily: FONT_MONO }} />
            <button onClick={handleApplyManual} className="text-xs px-3 py-2.5 tracking-widest uppercase"
              style={{ color: ACID, border: `1px solid ${ACID}33`, fontFamily: FONT_MONO }}>↲</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
