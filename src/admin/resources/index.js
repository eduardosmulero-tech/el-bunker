// Descriptores de CONTENIDO — las 6 entidades (contrato B3 / DISENO_PANEL_ADMIN §4.1).
// El `key` de cada descriptor coincide con el `item_type` de /api/classify (A1):
// entry, file, track, playlist, capsule, drop.
import entries from "./entries";
import files from "./files";
import tracks from "./tracks";
import playlists from "./playlists";
import capsules from "./capsules";
import drops from "./drops";

export const CONTENT_RESOURCES = [entries, files, tracks, playlists, capsules, drops];

export const CONTENT_ITEM_TYPES = CONTENT_RESOURCES.map((resource) => resource.key);

export default CONTENT_RESOURCES;
