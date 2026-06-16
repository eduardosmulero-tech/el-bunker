// ============================================================
//  EL BÚNKER — workers/config.js
//  Constantes compartidas: whitelist, prefixes, CORS
// ============================================================

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Lista hardcodeada de usuarios autorizados (ADR-006)
export const WHITELIST = {
  "thebunker.admin@gmail.com": "admin",
  "bansovi.py@gmail.com": "edu",
  "dcgdozt@gmail.com": "david",
};

// Prefixes válidos para upload (S113-W)
export const VALID_UPLOAD_PREFIXES = [
  "music",
  "vault/photos",
  "vault/videos",
  "vault/docs",
  "vault/audio",
];

export const JWT_EXPIRY = 24 * 60 * 60; // 24 horas
