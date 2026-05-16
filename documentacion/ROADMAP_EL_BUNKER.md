# ROADMAP — EL BÚNKER
**Fecha:** Mayo 2026 | **Versión de referencia:** código actual en zip

---

## CONTEXTO RÁPIDO PARA ESTA SESIÓN

- **Quién usa la app:** Tú (Admin) + Edu (bansovi.py@gmail.com) + David (dcgdozt@gmail.com)
- **Stack:** React + Vite + Tailwind v3 + Google Drive API (OAuth2, appDataFolder)
- **DB:** `the_vault_database.json` en appDataFolder de la cuenta Admin
- **Flujo de trabajo:** Claude (Arquitecto) diseña → Cline/Qwen local (Picador) ejecuta en disco
- **Estado real:** Solo has entrado una vez con Admin. Edu y David nunca han entrado.

---

## MAPA COMPLETO DE FEATURES (lo que ya existe en código)

### TAB 1 — VAULT
| Feature | Estado real |
|---|---|
| Pantalla de boot con terminal animado | ✅ REAL (puro CSS/JS, no depende de Drive) |
| Login OAuth Google + popup | ✅ REAL |
| Whitelist por email (Admin/Edu/David) | ✅ REAL (hardcoded en GoogleDriveService.js) |
| Pantalla acceso denegado | ✅ REAL |
| Creación de DB en Drive (primera vez) | ✅ REAL |
| StatusBar: estado DB + reloj + punto auth | ✅ REAL |
| BottomNav con 4 tabs + animación | ✅ REAL |
| Adventure Counter (días desde fecha) | ✅ REAL (lee `adventures_start_date` de DB) |
| HeartbeatWidget (verde/rojo) | ✅ REAL (escribe en Drive c/20min) |
| Slider horizontal de Eras | ✅ REAL si hay eras en DB / DEMO si está vacía |
| Demo fallback "ORIGEN/TORMENTA/RENACIMIENTO" | ⚠️ DEMO PURO — no se guarda, es visual |
| Panel de detalle por Era (contadores entradas/fotos/notas) | ✅ REAL (filtra db.entries) |
| Botón "+ ERA" | ⚠️ SOLO LOG en consola — modal no existe |
| Cápsulas del Tiempo (sección en Vault) | ❌ DEMO PURO — hardcoded, no conectado a DB |

### TAB 2 — TIMELINE
| Feature | Estado real |
|---|---|
| Contenido | ❌ PLACEHOLDER — solo texto "PRÓXIMAMENTE" animado, intencional |

### TAB 3 — MUSIC LAB
| Feature | Estado real |
|---|---|
| Reproductor estilo Winamp | ✅ REAL (HTML5 audio) |
| Visualizador Web Audio API (barras reactivas) | ✅ REAL |
| Animación idle cuando no hay audio | ✅ REAL |
| Filtros por Vibe (ALL/GAMING/420 CHILL/DnB/ROMANTIQUEO) | ✅ REAL |
| Añadir track (título, artista, URL, nota, vibe) | ✅ REAL — se persiste en Drive vía onAddTrack |
| Parseo de URL de YouTube (extrae ID) | ✅ REAL (pero no descarga, solo parsea) |
| The Drop — lanzar canción con mensaje | ✅ REAL — se persiste en Drive vía onAddDrop |
| DropAlertModal — modal al entrar si hay drop no visto | ✅ REAL — detecta `seen: false` |
| **markDropSeen** — marcar drop como visto | ❌ BUG CRÍTICO — `onMarkDropSeen` no está conectado en App.jsx. El modal puede cerrarse pero el drop NUNCA se marca como visto en Drive. Cada vez que entras vuelve a salir el mismo Drop |
| Historial de Drops | ✅ REAL (lee db.music_lab.drops) |

### TAB 4 — CAPSULES (Smoke Session)
| Feature | Estado real |
|---|---|
| Timer circular SVG con progreso | ✅ REAL |
| Presets (15/30/45/60/90 min) + CUSTOM | ✅ REAL |
| Play / Pause / Reset | ✅ REAL |
| Fade-out automático últimos 2 min (baja masterVolume) | ✅ REAL — conectado a VaultContext.masterVolume |
| Restaurar volumen al terminar | ✅ REAL |
| El fade interactúa con MusicLab (mismo masterVolume) | ✅ REAL — compartido vía contexto |

### SISTEMA DE BIBLIOTECAS (gestión de cuentas de almacenamiento)
| Feature | Estado real |
|---|---|
| Lógica de `at_risk` / `lost` por fecha | ✅ REAL (cálculo automático) |
| `markLibraryHeartbeat` — registrar visita manual | ✅ REAL |
| `refreshLibraryCapacity` — medir uso en GB | ✅ REAL |
| `librariesAtRisk` / `librariesNearFull` en contexto | ✅ REAL (calculados) |
| UI en la app que muestre el estado de bibliotecas | ❌ NO EXISTE — la lógica está pero nadie la muestra |

---

## BUGS CONFIRMADOS EN CÓDIGO (sin testear aún)

### BUG CRÍTICO — markDropSeen nunca se llama
**Dónde:** `App.jsx` líneas 161-184, `MusicLab.jsx` línea 1101  
**Problema:** `MusicLab` espera la prop `onMarkDropSeen`. En `App.jsx` se pasa `onAddDrop` y `onAddTrack` pero **`onMarkDropSeen` no existe**. El drop nunca se marca como visto en Drive.  
**Síntoma:** El mismo Drop sale en modal cada vez que Edu o David abre la app.  
**Fix (Pliego para Picador):** En `App.jsx`, dentro de `MusicPage`, añadir:
```js
onMarkDropSeen={async (dropId) => {
  await patchDb((prev) => ({
    ...prev,
    music_lab: {
      ...prev.music_lab,
      drops: (prev.music_lab?.drops ?? []).map((d) =>
        d.id === dropId ? { ...d, seen: true } : d
      ),
    },
  }));
}}
```

### BUG MENOR — HeartbeatWidget usa umbral 20 meses, CONFIG usa 18
**Dónde:** `Vault.jsx` (HeartbeatWidget) vs `GoogleDriveService.js` (LIBRARY_AT_RISK_MONTHS)  
**Problema:** Inconsistencia visual menor — el widget dice "en riesgo" a los 20 meses pero la lógica de bibliotecas lo marca a los 18.  
**Fix:** Extraer la constante al contexto o a un archivo de config compartido.

---

## FASE 0 — BLOQUEANTE TOTAL (sin esto nada funciona)

**Objetivo:** Que los 3 usuarios puedan entrar a la app en local y ver su nombre correcto.

### F0.1 — Google Cloud Console (si no está hecho)
- Verificar que `.env` tiene `VITE_GOOGLE_CLIENT_ID` con el CLIENT_ID real
- Verificar en Google Cloud: los 3 emails añadidos como usuarios de prueba
- Scopes activos: `drive.appdata` + `drive.readonly`
- Origen JS autorizado: `http://localhost:5173`

### F0.2 — Login con Admin (validar DB)
- Hacer login → popup Google → entrar con `thebunker.admin@gmail.com`
- Abrir DevTools → Console → buscar log `[DB creada]` o similar de VaultContext
- Abrir Drive de Admin → Settings → Ver archivos de app → confirmar que `the_vault_database.json` existe

### F0.3 — Login con Edu y David
- Edu entra con `bansovi.py@gmail.com` → debe ver "Edu" en UI
- David entra con `dcgdozt@gmail.com` → debe ver "David" en UI
- Un email no autorizado → pantalla de acceso denegado ✅

### F0.4 — Recorrer la testing_checklist_v2.txt (secciones 1-8)
Ejecutar en orden. Marcar `[x]` o `[!]` en el archivo real. Prioridad de secciones:
1. Sección 3 (Auth) — crítica
2. Sección 6 (DB sync) — crítica
3. Sección 7 (Heartbeat) — importante
4. Sección 8 (Vault visual) — confirma qué es demo vs real
5. Secciones 1-2 (PWA/Login estética) — al final de esta fase

---

## FASE 1 — CORE: LO QUE DEBE FUNCIONAR ANTES DE INSTALAR EN MÓVILES

**Objetivo:** Que la app sea funcional y no tenga bugs que arruinen la experiencia en el primer uso de Edu/David.

### F1.1 — Arreglar markDropSeen (BUG CRÍTICO)
Ver pliego en sección de bugs. Es una función de 10 líneas en App.jsx.  
**Sin esto:** Edu/David verán el mismo Drop cada vez que abran la app. Experiencia rota.

### F1.2 — Modal real de "Crear Era"
**Dónde:** `App.jsx` > `VaultPage` > prop `onAddEra`  
Actualmente solo hace `console.log`. Necesita un modal con campos: nombre, color, descripción, fecha de inicio.  
La función `addEra()` ya existe en `GoogleDriveService.js` — solo falta la UI.  
**Pliego para Picador:** Crear componente `AddEraModal` en `Vault.jsx` que se activa con el botón "+ ERA". Al confirmar llama a `patchDb` con la nueva Era.

### F1.3 — Verificar que Eras reales se muestran (no el demo)
Crear al menos 1 Era real desde el modal (F1.2) y confirmar que el slider muestra esa Era y no "ORIGEN/TORMENTA/RENACIMIENTO".

### F1.4 — Testing secciones 9 (Music Lab) y 10 (Smoke Session)
Ejecutar checklist. Foco especial en:
- 9.2 (Play/Pause con URL real de audio)
- 9.21 (Track añadido persiste en Drive tras cerrar y reabrir)
- 9.27-9.31 (flujo completo de Drop: enviar → modal → marcar visto)
- 10.9-10.13 (fade-out y restauración de volumen)

### F1.5 — Verificar DB compartida entre usuarios
Con Edu y Admin en la misma sesión (dos navegadores/dispositivos):
- Admin añade un track → Edu hace refresh → ¿aparece el track?
- Edu cierra y reabre → ¿los datos persisten?
Este es el test más importante del sistema.

---

## FASE 2 — INSTALACIÓN EN MÓVILES (PWA)

**Objetivo:** Edu y David tienen la app instalada en su móvil como si fuera una app nativa.

### Prerequisito: Hosting
La app necesita estar en una URL HTTPS para instalarse como PWA. Opciones en orden de coste:
1. **Vercel** (gratis, recomendado) — `vercel deploy` desde el proyecto
2. **Netlify** (gratis)
3. **GitHub Pages** (gratis pero requiere ajuste de rutas)

### F2.1 — Deploy inicial
- `npm run build` → carpeta `dist/`
- Deploy en Vercel → obtener URL tipo `https://el-bunker.vercel.app`
- Añadir esa URL a los orígenes autorizados en Google Cloud Console

### F2.2 — Verificar PWA en móvil
Checklist sección 1 (PWA) completa:
- Banner "Añadir a pantalla de inicio" aparece
- App se instala como standalone (sin barra de navegador)
- Icono correcto con fondo #050505
- Service Worker se registra (`[Búnker] SW registered` en consola)

### F2.3 — Login en móvil
El popup de OAuth en móvil puede comportarse diferente. Probar con Admin, luego Edu, luego David.  
En iOS Safari el popup puede bloquearse — puede requerir ajuste en LoginScreen.jsx.

### F2.4 — Testing completo en móvil
Ejecutar toda la testing_checklist_v2.txt en dispositivo real. Secciones críticas:
- 5.6-5.10 (Layout, que nada quede tapado por notchS/barras del SO)
- 8.6 (Swipe en slider de Eras)
- 14.8 (Animaciones Framer Motion sin layout shifts)

---

## FASE 3 — COMPLETAR FEATURES DEL DISEÑO ORIGINAL

Solo después de que Fases 0-2 estén completas. En orden de impacto:

### F3.1 — Subida real de fotos a Drive (P-01 + P-02 de auditoría)
La feature más compleja pendiente. Requiere:
- Función `uploadPhotoToDrive(file, eraId)` en GoogleDriveService.js
- Obtención de URL de visualización tras subida
- Scope `drive.file` (ya incluido en la config)

### F3.2 — Galería de fotos por Era (P-05)
Componente que muestre las entries de `type: "photo"` con preview visual.

### F3.3 — Cápsulas del Tiempo reales (P-06)
Reemplazar `demoTimeCapsules` en Vault.jsx por lectura de `db.entries` donde `type === "capsule"` con campo `unlock_date`.

### F3.4 — UI de bibliotecas en la app (P-08)
Mostrar el estado de las cuentas biblioteca (at_risk/near_full) en algún lugar de Vault.  
La lógica ya existe en VaultContext — solo falta consumirla.

### F3.5 — Sincronizar umbral HeartbeatWidget (bug menor)
Alinear los 20 meses del widget con los 18 meses de CONFIG.

---

## FASE 4 — FEATURES NUEVAS (después del lanzamiento)

Ideas documentadas en los archivos, ninguna debe tocarse antes:
- Timeline real (línea de tiempo visual de Eras y entradas)
- Importador de YouTube con descarga real de audio
- Cover image real por Era (subida de foto de portada)
- Sistema de PIN / contenido sensible (is_sensitive flag)
- Edición de Era existente (nombre, color, fechas)

---

## RESUMEN EJECUTIVO — QUÉ HACER AHORA MISMO

```
HOY:
  1. Verifica F0.1 (Google Cloud) — sin esto nada arranca
  2. Login con Admin → confirma DB en Drive
  3. Login con Edu y David → confirman que entran
  4. Arregla markDropSeen (10 líneas en App.jsx con Cline)

ESTA SEMANA:
  5. Crea el modal de "Crear Era" (F1.2)
  6. Ejecuta la testing_checklist_v2.txt completa
  7. Test de DB compartida entre Edu y Admin

DESPUÉS:
  8. Deploy en Vercel
  9. Instalar PWA en móviles de Edu y David
  10. Testing en dispositivos reales

MÁS ADELANTE:
  11. Subida real de fotos (la feature más grande pendiente)
  12. Cápsulas del Tiempo reales
  13. Lo que queda de Fase 3
```

---

## CÓMO TRABAJAR CON CLAUDE EN PRÓXIMAS SESIONES

Para evitar el efecto teléfono y los cortes:

1. **Sube siempre el zip del proyecto** al inicio de cada sesión nueva
2. **Un archivo por sesión** — no intentes resolver 5 cosas a la vez
3. **Pide "Pliego de Condiciones"** — Claude diseña la lógica en lenguaje preciso, Cline la ejecuta en disco
4. **Confirma antes de avanzar** — cada F0.X debe estar marcada como ✅ antes de pasar a F1.X

---

*EL BÚNKER · ROADMAP v1.0 · Mayo 2026*
