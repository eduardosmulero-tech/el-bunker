const PHOTON_URL = "https://photon.komoot.io/api/";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function searchLocation(query) {
  if (!query.trim() || query.length < 2) return [];

  const parsePhoton = (data) => (data.features || []).map((f) => {
    const props = f.properties;
    const parts = [props.name, props.city || props.town || props.village, props.country].filter(Boolean);
    return { label: parts.join(", "), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], osm_type: props.osm_type, osm_id: props.osm_id };
  });

  const parseNominatim = (data) => data.map((p) => ({ label: p.display_name, lat: parseFloat(p.lat), lng: parseFloat(p.lon), osm_type: p.osm_type, osm_id: p.osm_id }));

  try {
    const res = await fetch(`${PHOTON_URL}?q=${encodeURIComponent(query)}&lang=es&limit=5`);
    if (res.ok) { const data = await res.json(); if (data.features?.length) return parsePhoton(data); }
  } catch {}

  try {
    const res = await fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=es`, { headers: { "User-Agent": "ElBunker/1.0" } });
    if (res.ok) { const data = await res.json(); if (data.length) return parseNominatim(data); }
  } catch {}

  return [];
}
