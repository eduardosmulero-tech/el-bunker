# ACCESO TEST/ADMIN — Manual operativo (ADR-028)

> Mecanismo de acceso alternativo a Google OAuth para test y admin.
> Spec técnica: `docs/spec/SPEC_ACCESO_TEST_ADMIN_2026-08-02.md`.
> Este documento NO contiene claves reales. Nunca escribas una clave aquí ni en el repo.

## 1. Qué es

Dos secrets del worker (`ADMIN_ACCESS_KEY` y `EDU_ACCESS_KEY`) que se canjean por el mismo
JWT de siempre (24 h) en `POST /api/auth/token`. La API sigue aceptando exclusivamente
JWT firmados con `JWT_SECRET` — esto solo cambia cómo se consigue la llave, no la puerta.
No hay clave para David: su flujo por Google queda intacto.

## 2. Para el agente (Hermes/scripts)

Exportar la clave en la sesión de terminal (nunca en un archivo del repo):

```bash
export BUNKER_ADMIN_KEY='<clave del agente>'
API=https://el-bunker-api.thebunker-admin.workers.dev

# Canje → JWT
JWT=$(curl -s -X POST "$API/api/auth/token" -H 'Content-Type: application/json' \
      -d "{\"key\":\"$BUNKER_ADMIN_KEY\"}" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

# Uso
curl -s -o /dev/null -w '%{http_code}\n' "$API/api/eras" -H "Authorization: Bearer $JWT"   # → 200
```

El agente entra como `admin`. Si un contenido debe figurar como de Edu, se manda
explícito en el body (`POST /api/entries` respeta `body.from_user` sobre el userId del token).

## 3. Para Edu en la app

1. En la pantalla de login, enlace discreto `› ACCESO TEST / ADMIN`.
2. Pegar la clave de Edu (`EDU_ACCESS_KEY`) → ENTRAR.
3. La casilla "RECORDAR EN ESTE DISPOSITIVO" está **desmarcada por defecto**: guarda una
   credencial permanente en el dispositivo a cambio de no teclearla cada vez (el
   sessionStorage de una PWA Android muere al cerrar la app). Marcar es una decisión
   explícita; el antídoto es rotar el secret (§4).

## 4. Generación, rotación y revocación

**Generar** (32 bytes aleatorios, 43 chars base64url):

```bash
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
```

**Instalar** (interactivo — pega la clave cuando la pida; nunca en el historial, nunca en
el repo). Los secrets nuevos van al **mismo worker y `--env` que `JWT_SECRET`**:

```bash
npx wrangler secret list                       # confirmar que JWT_SECRET está ahí
npx wrangler secret put ADMIN_ACCESS_KEY       # → clave del agente
npx wrangler secret put EDU_ACCESS_KEY         # → clave de Edu
```

**Rotar**: repetir `secret put` con una clave nueva. Las sesiones ya emitidas viven hasta
24 h (caducidad del JWT).

**Revocar una identidad de golpe**: `npx wrangler secret delete EDU_ACCESS_KEY` → nadie
puede volver a canjear con esa clave.

**Opción nuclear** (revocación inmediata de TODAS las sesiones vivas, incluida la de
David): `npx wrangler secret put JWT_SECRET` con un valor nuevo.

## 5. Auditoría

Cada emisión (Google y clave) escribe `auth_login` en la tabla `events` (ADR-019):

```bash
npx wrangler d1 execute el-bunker-db --remote --command \
  "SELECT created_at, user_id, payload FROM events WHERE event_type='auth_login' ORDER BY created_at DESC LIMIT 20"
```

Los **intentos fallidos** no van a D1 (no hay usuario): quedan en los logs del worker
(`console.warn("[auth] clave de acceso rechazada")`, observabilidad con
`head_sampling_rate = 1`). La Timeline de la app NO muestra eventos de login (filtro en
`GET /api/events`, spec §3.4); para verlos se consulta con `?type=auth_login`.

## 6. Qué NO es

- NO es un bypass de `authenticate()`: la API sigue rechazando todo lo que no sea un JWT
  válido firmado con `JWT_SECRET`.
- NO hay clave para David ni registro de usuarios nuevos (ADR-006 intacto).
- La clave nunca va al repo, a un commit, ni a un comando con la clave escrita en línea.
