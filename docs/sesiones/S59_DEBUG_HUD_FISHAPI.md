# SESIÓN S59 — DEBUG: HUD Windows + Fish Audio API
**Fecha:** Junio 2026
**Modelo:** deepseek/deepseek-v4-flash (Codebuff CLI)
**Contexto previo:** S54 (infraestructura Cloudflare). Rama: roadmap-completo.

---

## 🪲 BUG 1: Hermes HUD — Launcher Windows

### Síntoma
El `.bat` en `C:\Proyectos\Hermes\hermes_hud.bat` abre una terminal de CMD que se cierra inmediatamente. Nunca aparece la ventana de la HUD (Electron + WSLg).

### Arquitectura del launcher
```
Windows CMD (.bat)
  → cd /d C:\ (evita error de ruta UNC)
  → wsl -e bash -c "..."
      → cd ~/hermes-hud
      → export DISPLAY=:0
      → ./node_modules/electron/dist/electron . --no-sandbox
```

⚠️ **POSIBLE CAUSA NO EXPLORADA:** El `~` (tilde) en `cd ~/hermes-hud` puede
no expandirse correctamente cuando bash es invocado por `wsl -e bash -c "..."`.
Nunca se probó con ruta ABSOLUTA (`/home/edu/hermes-hud`).

### Intentos fallidos (orden cronológico)

| Intento | Qué se hizo | Resultado |
|---------|------------|-----------|
| 1 | `.bat` original con `npx electron` | Error: ruta UNC (`\\wsl.localhost\...`) no soportada por CMD |
| 2 | `pushd C:\` + `npx electron` | Mismo error UNC |
| 3 | `cd /d C:\` + `npx electron` | Terminal se abre y cierra. `npx` descarga electron cada vez |
| 4 | `launch_hud.ps1` (PowerShell) | Mismos síntomas |
| 5 | `test_wsl.bat` (verificar WSL) | WSL funciona, `npx` pide descarga |
| 6 | `./node_modules/electron/dist/electron` (binario directo) | Terminal se abre y cierra |
| 7 | Lógica `pgrep + kill` si ya activa | No cambia el problema base |
| 8 | **NUNCA se probó** con ruta ABSOLUTA `/home/edu/hermes-hud` | — |

### Diagnóstico actual
- **Electron SÍ instalado** en `~/hermes-hud/node_modules/electron/dist/electron` (v42.4.0, 215MB)
- **Main process SÍ compilado** (`dist/main/index.js`, `dist/main/preload.js`)
- **WSLg activo** (`DISPLAY=:0`)
- **No hay procesos HUD activos** (`pgrep -f 'electron.*hermes'` → vacío)
- **Elección:** electron directo (no npx) — ruta confirmada existente
- **Causa más probable:** (a) tilde ~ no se expande en `wsl -e bash -c`, o
  (b) faltan dependencias gráficas en WSL2 (libgtk-3, etc.), o
  (c) Electron crashea al arrancar en WSLg (falta GPU acceleration)

### Qué NO hacer (lecciones)
- ❌ No usar `npx` — fuerza descarga cada vez que expira el cache
- ❌ No añadir lógica de "matar proceso anterior" antes de que funcione el caso base
- ❌ No asumir que `~` se expande en `wsl -e bash -c` — siempre usar ruta absoluta
- ❌ No complicar con Ollama, pgrep, kill — el problema es que Electron no arranca
- ❌ No asumir WSLg configurado correctamente — verificar con `wsl -e xclock` o instalar x11-apps

---

## 🪲 BUG 2: Fish Audio API — 401 Invalid Token

### Síntoma
La API key obtenida de fish.audio/app/api-keys devuelve `401 Invalid Token`
para TODA llamada a `POST https://api.fish.audio/v1/tts`.

### ⚠️ El usuario afirma rotundamente que la key es correcta
Textual: *"la api que he pegado es la correcta, es la clave secreta de la api
creada"* y *"estoy pegando literalmente la que me da la pagina de donde tu me
has pedido que la saque"*. No es error del usuario al copiar.

### ⚠️ ~/.hermes/.env tiene la key DUPLICADA
```
FISH_API_KEY=e4fa6db37cf1429192373ba1393554c9   ← primera (la que lee tts_fish.py)
FISH_API_KEY=53baa1ee197a4ee98c180e132162ba08   ← segunda (sobrescribe la primera en bash)
```
El script `tts_fish.py` lee la PRIMERA (usa `break`). Si se carga el .env con
`source`, gana la ÚLTIMA. **Ambas devuelven 401.**

### Keys
- Key 1: `e4fa6db37cf1429192373ba1393554c9` (32 chars hex)
- Key 2: `53baa1ee197a4ee98c180e132162ba08` (32 chars hex)
- Formato: NO empiezan por `fsk_`

### Modelo objetivo
`cdd3e49eebf940068991b40983793133` (Jorge Loquendo TTS de Fish Audio)
URL: https://fish.audio/m/cdd3e49eebf940068991b40983793133/

### Intentos fallidos (orden cronológico)

| Intento | Formato API | Resultado |
|---------|------------|-----------|
| 1 | `model_id` en body (formato legacy) | 401 Invalid Token |
| 2 | `reference_id` + header `model: s2-pro` | 401 |
| 3 | Sin `model` header | 401 |
| 4 | Solo `text`, sin reference_id | 401 |
| 5 | GET `/v1/me` (validar key) | 404 |
| 6 | GET `/v1/models/{key}` | 404 |
| 7 | Auth `Key {key}` | 400 "Must be Bearer {apikey}" ✅ confirma Bearer es correcto |
| 8 | Auth `Basic {key}` | 400 "Must be Bearer {apikey}" |
| 9 | Auth `{key}` directo | 400 "Must be Bearer {apikey}" |
| 10 | `Bearer` con AMBAS keys | 401 en ambas |
| 11 | Con y sin header `model: s2-pro` | 401 siempre |

### Diagnóstico actual
- **Bearer auth es el formato correcto** (API confirma con "Must be Bearer")
- **Endpoint /v1/tts existe** (responde 401, no 404)
- **Modelo `cdd3e49eebf...` existe** en la web de Fish Audio
- **Ambas keys son 32-char hex** — formato que NO coincide con `fsk_` documentado
- **Causa más probable:**
  - (a) El modelo necesita ser "añadido a la biblioteca" del usuario para uso API
  - (b) El plan gratuito de Fish Audio NO incluye API REST (solo web)
  - (c) Cuenta no verificada (email pendiente)
  - (d) Fish Audio cambió su sistema de auth

### Qué NO hacer (lecciones)
- ❌ No cambiar el auth header — `Bearer` es correcto y verificado
- ❌ No probar más variantes de body/headers — el 401 es de autenticación
- ❌ No recomendar "crear otra key" — el usuario ya creó 2 y ambas fallan
- ❌ No proponer RVC, MBROLA, Piper, espeak — ya se descartaron

---

## Contenido actual del .bat (estado final)
```batch
@echo off
chcp 65001 >nul
cd /d C:\
title Hermes HUD

cls
echo =======================================
echo   HERMES HUD - Launcher Unificado
echo =======================================
echo.

:: 1. Verificar WSL
wsl echo OK >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] WSL no esta disponible.
    pause
    exit /b 1
)

:: 2. Si la HUD ya esta activa, MATAR el proceso antiguo
wsl -e bash -c "pids=$(pgrep -f 'electron.*hermes-hud' 2>/dev/null);
  if [ -n \"$pids\" ]; then echo \"$pids\"; else echo 'NINGUNA'; fi"
  > "%temp%\_hud_pids.txt" 2>&1
set /p HUD_PIDS=<"%temp%\_hud_pids.txt"

if not "%HUD_PIDS%"=="NINGUNA" (
    echo [i] Cerrando sesion anterior (PID: %HUD_PIDS%)...
    wsl -e bash -c "kill %HUD_PIDS% 2>/dev/null; sleep 1" >nul 2>&1
    echo [i] Terminado. Arrancando nueva sesion...
    timeout /t 1 /nobreak >nul
)

:: 3. Verificar / arrancar Ollama
echo [1/2] Verificando servicios...
wsl -e bash -c "curl -s http://localhost:11434/api/tags >/dev/null 2>&1
  && echo 'OK' || echo 'OFF'" > "%temp%\_ollama_status.txt" 2>&1
set /p OLLAMA_STATUS=<"%temp%\_ollama_status.txt"

:: ... (bucle de espera para Ollama hasta 8 intentos)

:: 4. Lanzar la HUD
echo [2/2] Lanzando Hermes HUD...
wsl -e bash -c "cd ~/hermes-hud && export DISPLAY=:0
  && ./node_modules/electron/dist/electron . --no-sandbox"

echo HUD cerrada.
pause
```

---

## 🔧 Archivos modificados durante la sesión

| Archivo | Acción |
|---------|--------|
| `C:\Proyectos\Hermes\hermes_hud.bat` | Reescrito ~6 veces (npx → electron directo → pgrep+kill) |
| `C:\Proyectos\Hermes\launch_hud.ps1` | Creado (PowerShell, mismo problema) |
| `C:\Proyectos\Hermes\test_wsl.bat` | Creado (test WSL, funcional) |
| `/home/edu/.hermes/tts_fish.py` | Reescrito (model_id → reference_id + s2-pro header) |
| `/home/edu/.hermes/.env` | User añadió FISH_API_KEY (2 veces, duplicada) |

---

## 📂 Estado final del proyecto

### Windows (`C:\Proyectos\Hermes\`)
- `hermes_hud.bat` — Launcher (NO funcional — terminal se cierra)
- `launch_hud.ps1` — Alternativa PowerShell (NO funcional)
- `hermes_windows.bat` — Menú de servicios (funcional)
- `test_wsl.bat` — Test conectividad WSL (funcional)
- `launch_hud.ps1` — PowerShell (NO funcional)

### WSL (`~/hermes-hud/`)
- Electron v42.4.0 + React + Vite + Zustand
- Main process compilado (`dist/main/index.js`, `dist/main/preload.js`)
- Sin proceso activo

### WSL (`~/.hermes/`)
- `tts_fish.py` — Wrapper Fish Audio (formato correcto, key inválida)
- `.env` — Keys duplicadas
