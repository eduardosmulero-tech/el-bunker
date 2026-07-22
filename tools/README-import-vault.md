# EL BÚNKER — Importación masiva VAULT

Script para importar fotos y vídeos en lote desde Google Takeout + carpeta del móvil.

## Requisitos

- Node.js 18+
- Token JWT de sesión activa en el-bunker (ver abajo cómo obtenerlo)
- Las carpetas de entrada en local (no necesita conexión a internet más que para la subida)

## Instalación

```bash
cd el-bunker
npm install  # exifr ya está como devDependency
```

## Cómo obtener el token JWT

1. Abre https://el-bunker-beige.vercel.app en Chrome
2. Inicia sesión con Google
3. Abre DevTools (F12) → Application → Local Storage → `https://el-bunker-beige.vercel.app`
4. Copia el valor de la clave `bunker_token`
5. Pásalo con `--token "<valor-completo>"`

El token expira en 24h. Si falla la autenticación, repite estos pasos.

## Uso

### Flujo directo (sin revisión manual)

```bash
# 1. DRY-RUN (por defecto) — solo reporta, no sube nada
node tools/import-vault.mjs \
  --takeout ./carpeta-takeout \
  --mobile ./carpeta-dcim \
  --token "eyJ..."

# 2. SUBIDA REAL — añade --commit
node tools/import-vault.mjs \
  --takeout ./carpeta-takeout \
  --mobile ./carpeta-dcim \
  --token "eyJ..." \
  --commit
```

### Flujo con staging (revisión manual antes de subir, recomendado)

```bash
# Paso 1: Copiar a carpeta de revisión (sin token, sin subir nada)
node tools/import-vault.mjs \
  --takeout ./carpeta-takeout \
  --mobile ./carpeta-dcim \
  --stage D:\bunker-import-review

# Paso 2: Revisar manualmente en el Explorador de Windows
#   - Abrir D:\bunker-import-review
#   - Revisar _posibles_capturas/ (posibles capturas de pantalla)
#   - Borrar lo que NO quieras subir (privacidad, ruido, etc.)

# Paso 3: Subir desde staging (primero dry-run para confirmar)
node tools/import-vault.mjs \
  --staged D:\bunker-import-review \
  --token "eyJ..."

# Paso 4: Si el dry-run es correcto, añadir --commit
node tools/import-vault.mjs \
  --staged D:\bunker-import-review \
  --token "eyJ..." \
  --commit
```

### Argumentos

| Flag | Requerido | Descripción |
|------|-----------|-------------|
| `--takeout <path>` | Sí (directo/stage) | Carpeta con el ZIP de Google Takeout descomprimido |
| `--mobile <path>` | Sí (directo/stage) | Carpeta DCIM/cámara copiada del móvil por USB |
| `--token <jwt>` | Sí (directo/staged) | Token JWT de sesión activa |
| `--stage <carpeta>` | No | Copiar a carpeta de revisión (sin subir) |
| `--staged <carpeta>` | No | Subir desde carpeta de staging ya revisada |
| `--commit` | No | Ejecutar subida real (sin flag = dry-run) |
| `--api <url>` | No | URL base de la API (defecto: `https://el-bunker-api.thebunker-admin.workers.dev`) |
| `--manifest <path>` | No | JSON de resumibilidad (defecto: `./import-manifest.json`) |
| `--concurrency <n>` | No | Subidas paralelas (defecto: 3) |
| `--help` | No | Mostrar ayuda |

## Flujo del script

### Fase 1 — Escaneo
Recorre recursivamente ambas carpetas, encontrando archivos de foto (`.jpg`, `.jpeg`, `.png`, `.heic`, `.webp`, `.gif`, `.bmp`, `.tiff`) y vídeo (`.mp4`, `.mov`, `.avi`, `.mkv`, `.3gp`, `.wmv`, `.webm`).

### Fase 2 — Metadatos
- **Takeout:** Lee el `.json` sidecar de cada archivo (`IMG_001.jpg.json` o `.supplemental-metadata.json`) extrayendo `photoTakenTime`, `geoData` (lat/lng), `title`, `description`.
- **Móvil:** Lee EXIF (`DateTimeOriginal`, `CreateDate`, GPS) vía `exifr` (librería JS pura, sin dependencias nativas).
- **Fallback:** Si no hay fecha, usa la fecha de modificación del archivo.

### Fase 3 — Hashes
Calcula SHA-256 completo + SHA-256 de los primeros 64KB (para detección de duplicados re-comprimidos).

### Fase 4 — Deduplicación
1. **Dentro de Takeout:** hash exacto → archivos byte-idénticos
2. **Dentro del móvil:** hash exacto → archivos byte-idénticos
3. **Cruzado (Takeout ↔ móvil):** puntuación multi-señal:
   - Mismo nombre de archivo (+1)
   - Hash de primeros 64KB idéntico (+2, señal fuerte)
   - Fecha de captura dentro de ±5s (+1)
   - GPS dentro de 100m (+1)
   - Tamaño similar (±30%) (+1)
   - **Umbral: ≥4/6 = duplicado**

> **Nota sobre hash perceptual:** No se incluye pHash/dHash porque las librerías de procesamiento de imagen (sharp, jimp) requieren dependencias nativas que complican la instalación. La combinación de hash parcial + timestamp + GPS + nombre es suficientemente fiable para el volumen esperado. Si hubiera falsos negativos (duplicados no detectados), es seguro re-ejecutar el script — los que ya subió aparecen en el manifiesto.

### Fase 5 — Reporte (dry-run)
Muestra resumen: archivos encontrados, duplicados, a subir, con/sin fecha, con/sin GPS, tamaño total.

### Fase 6 — Subida (`--commit`)
Para cada archivo no duplicado:
1. `POST /api/upload` → genera `r2_key` + `file_id`
2. `PUT /api/upload/:r2_key` → sube el binario a R2
3. `POST /api/entries` → crea la entrada en D1 con `from_user="edu"`, fecha real, ubicación si hay GPS, archivo linkeado

Cada archivo subido se registra en el manifiesto. Si el script se interrumpe, al re-ejecutar salta los ya registrados.

## Manifiesto de resumibilidad

Archivo JSON (`import-manifest.json` por defecto) con estructura:

```json
{
  "entries": {
    "<sha256>": {
      "r2_key": "vault/photos/uuid_filename.jpg",
      "file_id": "uuid",
      "entryId": "uuid",
      "filename": "IMG_001.jpg",
      "uploadedAt": "2026-07-08T..."
    }
  },
  "stats": {},
  "updatedAt": "..."
}
```

La clave es el SHA-256 completo del archivo. Si se re-ejecuta el script, los archivos cuyo hash ya esté en el manifiesto se saltan automáticamente.

## Qué NO hace

- No asigna `era_id` — Edu organiza las entradas en eras después, desde la app.
- No distingue autor (todo es `from_user="edu"`).
- No conecta con Google Photos API (Google cerró ese acceso).
- No modifica la UI ni el código de la app — es una herramienta CLI independiente.

## Solución de problemas

- **"Unauthorized" (401):** el token JWT expiró. Vuelve a obtener uno fresco de localStorage.
- **"Invalid prefix" (400):** bug interno — reporta a Edu.
- **"Too many requests" (429):** baja `--concurrency` a 1-2.
- **Archivos fallidos:** re-ejecuta el script — los ya subidos están en el manifiesto y se saltan.
- **Falsos positivos de dedupe:** los archivos filtrados como duplicados no se suben. Si crees que un archivo se filtró incorrectamente, comprueba el dry-run y ajusta manualmente.

## Endpoints usados

- `POST /api/upload` (`workers/routes/upload.js:20`) — genera r2_key + file_id
- `PUT /api/upload/:key` (`workers/routes/upload.js:37`) — subida binaria a R2
- `POST /api/entries` (`workers/routes/entries.js:81`) — crea entry en D1

Auth: `Authorization: Bearer <jwt>` en todas las peticiones.
