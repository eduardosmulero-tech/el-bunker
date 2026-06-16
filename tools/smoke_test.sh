#!/usr/bin/env bash
# ============================================================
#  EL BÚNKER — Smoke Test E2E (S120-QA)
#  Testea los endpoints públicos del Worker API.
#  Uso: bash tools/smoke_test.sh [JWT_TOKEN]
#
#  Sin JWT_TOKEN: solo testea health (público).
#  Con JWT_TOKEN: testea auth + tracks + events.
# ============================================================
set -euo pipefail

API_BASE="${API_BASE:-https://el-bunker-api.thebunker-admin.workers.dev}"
JWT="${1:-}"
CURL_AUTH=()   # array vacío; se llena si hay JWT
PASS=0
FAIL=0

green()  { echo -e "\033[32m✓ $1\033[0m"; }
red()    { echo -e "\033[31m✗ $1\033[0m"; }
yellow() { echo -e "\033[33m○ $1 (skipped)\033[0m"; }

do_curl() {
  local url="$1" method="${2:-GET}" body="${3:-}"
  local extra_args=("${CURL_AUTH[@]}")
  if [ -n "$body" ]; then
    extra_args+=(-H "Content-Type: application/json" -d "$body")
  fi
  curl -s -o /dev/null -w "%{http_code}" -X "$method" "${extra_args[@]}" "$url"
}

assert_status() {
  local label="$1" expected="$2" url="$3" method="${4:-GET}" body="${5:-}"
  local code
  code=$(do_curl "$url" "$method" "$body")
  if [ "$code" = "$expected" ]; then
    green "$label (HTTP $code)"; PASS=$((PASS+1))
  else
    red "$label — expected $expected, got $code"; FAIL=$((FAIL+1))
  fi
}

# Sin auth (CURL_AUTH vacío)
assert_status_noauth() {
  local saved=("${CURL_AUTH[@]}")
  CURL_AUTH=()
  assert_status "$@"
  CURL_AUTH=("${saved[@]}")
}

echo ""
echo "═══════════════════════════════════════════"
echo "  EL BÚNKER — SMOKE TEST"
echo "  API: $API_BASE"
echo "═══════════════════════════════════════════"
echo ""

# ─── PÚBLICO ────────────────────────────────────────────
echo "── Público ──"
assert_status "GET /api/health" 200 "$API_BASE/api/health"

# ─── AUTENTICADO ────────────────────────────────────────
if [ -z "$JWT" ]; then
  yellow "Sin JWT_TOKEN — tests autenticados omitidos."
  yellow "Pasa el token así: bash tools/smoke_test.sh <JWT>"
else
  CURL_AUTH=(-H "Authorization: Bearer $JWT")
  echo ""
  echo "── Autenticado ──"

  assert_status "GET /api/auth/verify (válido)"   200 "$API_BASE/api/auth/verify"
  assert_status "GET /api/tracks"                  200 "$API_BASE/api/tracks"
  assert_status "GET /api/tracks?limit=1"          200 "$API_BASE/api/tracks?limit=1"
  assert_status "GET /api/playlists"               200 "$API_BASE/api/playlists"
  assert_status "GET /api/tags"                    200 "$API_BASE/api/tags"
  assert_status "GET /api/drops"                   200 "$API_BASE/api/drops"
  assert_status "GET /api/entries"                 200 "$API_BASE/api/entries"
  assert_status "GET /api/eras"                    200 "$API_BASE/api/eras"
  assert_status "GET /api/events?limit=5"          200 "$API_BASE/api/events?limit=5"
  assert_status "GET /api/time_capsules"           200 "$API_BASE/api/time_capsules"

  # Sin token → 401
  assert_status_noauth "GET /api/tracks (sin token)" 401 "$API_BASE/api/tracks"
fi

# ─── RESUMEN ────────────────────────────────────────────
echo ""
echo "───────────────────────────────────────────"
echo "  Resultado: $PASS pasaron, $FAIL fallaron"
echo "───────────────────────────────────────────"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
