// ============================================================
//  EL BÚNKER — GoogleDriveService.js (legacy facade)
//  Compatibilidad histórica: Google se usa solo para OAuth.
//  Persistencia y reproducción: Worker/D1/R2.
//  No añadir imports nuevos a este módulo; usar GoogleAuthService.
// ============================================================

export {
  EMPTY_DB,
  initGoogleServices,
  requestAccessToken,
  signOut,
  restoreToken,
  isAuthenticated,
  getAccessToken,
  onAuthChange,
  resolveUser,
  isAuthorizedEmail,
  _calcLibraryStatus,
} from "./GoogleAuthService";

import * as GoogleAuthService from "./GoogleAuthService";
import { getStreamUrl as getR2StreamUrl } from "./FileUploadService";

/** @deprecated Playback is R2-only; kept for historical imports. */
export const getStreamUrl = (track) => getR2StreamUrl(track?.r2_key);

/** @deprecated Drive library reads were retired in G3; use D1/R2 metadata. */
export const listLibraryContents = async () => {
  throw new Error("Google Drive library reads are retired; use D1/R2 files.");
};
export const calculateLibraryUsage = async () => {
  throw new Error("Google Drive capacity reads are retired; use D1/R2 metadata.");
};
export const checkLibraryCapacity = async () => {
  throw new Error("Google Drive capacity reads are retired; use D1/R2 metadata.");
};

export default { ...GoogleAuthService.default, getStreamUrl, listLibraryContents, calculateLibraryUsage, checkLibraryCapacity };
