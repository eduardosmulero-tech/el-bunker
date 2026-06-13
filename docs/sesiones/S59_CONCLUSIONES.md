# ANEXO S59 — CONCLUSIONES FINALES (deepseek-v4-pro)

## 🪲 BUG 1: HUD — DIAGNÓSTICO COMPLETO Y .BAT FINAL

### Lo que se confirmó
- ✅ Electron v42.4.0 funciona en WSLg con `--no-sandbox --disable-gpu`
- ✅ Test mínimo exitoso: `APP_READY OK` + `WINDOW_CREATED OK` + exit code 0
- ✅ El proceso de hermes-hud se mantiene vivo 4+ segundos (ventana creada)
- ✅ `ldd` confirma que todas las libs gráficas están presentes: libgtk-3.so.0, libatk-bridge-2.0.so.0, libgbm.so.1
- ✅ `dist/renderer/index.html` y `dist/main/index.js` existen

### Causa raíz más probable
`main.jsx` tiene `show: false` + `ready-to-show`. Si el renderer (React) falla al cargar (JS error, archivo no encontrado, NODE_ENV no definido), el evento `ready-to-show` nunca se dispara → ventana invisible → proceso muere sin mostrar nada.

### .bat final (C:\Proyectos\Hermes\hermes_hud.bat)
```batch
@echo off
chcp 65001 >nul
cd /d C:\
title Hermes HUD
cls
echo =======================================
echo   HERMES HUD
echo =======================================
echo Lanzando... (si no ves la ventana, Alt+Tab o revisa WSLg)
echo.
wsl -e bash -c "cd /home/edu/hermes-hud && export DISPLAY=:0 && export NODE_ENV=production && ./node_modules/electron/dist/electron . --no-sandbox --disable-gpu 2>/tmp/hermes_hud_stderr.log"
echo.
echo HUD cerrada.
echo Errores guardados en WSL: /tmp/hermes_hud_stderr.log
pause
```

Características:
- Ruta absoluta `/home/edu/hermes-hud` (no ~)
- `NODE_ENV=production` para que cargue `dist/renderer/index.html`
- `--no-sandbox --disable-gpu` (flags confirmados funcionales)
- stderr redirigido a `/tmp/hermes_hud_stderr.log` para debug
- Sin Ollama, sin pgrep, sin kill (simplicidad)

### Si sigue sin verse la ventana
1. Revisar `/tmp/hermes_hud_stderr.log` (errores del renderer)
2. Probar `NODE_ENV=development` + `npm run dev` en otra terminal
3. El .bat funciona — el bug puede estar en el React frontend

---

## 🪲 BUG 2: Fish Audio — CONCLUSIÓN

### Lo que se confirmó
- ✅ `GET /model` es un endpoint PÚBLICO (devuelve 200 sin auth)
- ❌ La API key falla en TODOS los endpoints autenticados:
  - `POST /v1/tts` → 401
  - `GET /wallet` → 401
- ❌ El formato Bearer es correcto (API confirma con "Must be Bearer {apikey}" si se usa otro)
- ✅ El modelo Jorge Loquendo existe en fish.audio/m/cdd3e49eebf...

### Conclusión
La API key NO es válida para ningún endpoint autenticado de Fish Audio.

### Posibles causas (por probabilidad)
1. Cuenta no verificada (email pendiente de confirmación)
2. API key creada pero no activada en el dashboard
3. El plan gratuito requiere añadir créditos/balance mínimo
4. La key copiada no es del panel correcto (fish.audio/app/api-keys)

### Qué debe hacer el usuario
1. Iniciar sesión en fish.audio
2. Verificar email de confirmación (revisar spam)
3. Ir a fish.audio/app/api-keys
4. Crear una NUEVA API key (las anteriores pueden estar viciadas)
5. Probar con: `curl -H "Authorization: Bearer NUEVA_KEY" https://api.fish.audio/wallet`
   - Si devuelve 200 → clave válida ✅
   - Si devuelve 401 → cuenta no verificada o sin balance
