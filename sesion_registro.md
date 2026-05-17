# SESIÓN REGISTRO — el_bunker
> Estado actual y pendientes. Se actualiza al final de cada sesión.
> Decisiones permanentes NO van aquí → ver decisiones_tecnicas.md
> Errores resueltos NO van aquí → ver errores_conocidos.md

---

## ESTADO ACTUAL (16 Mayo 2026)

- App funciona en local (localhost:5173). 
- Diagnóstico de ERROR 4 completado: el problema de acceso cruzado a la DB requiere abandonar `appDataFolder`.
- Decisión arquitectónica tomada (ADR-001): Mover la DB a una carpeta compartida en el Drive del admin.
- Pliegos 001, 002 y 003 generados y listos para ejecutar con Qwen vía Cline para realizar la migración.
- Git inicializado. Commit inicial: `fc98830` — estado 15 mayo.
- Deploy a Vercel/GitHub pendiente.
- WSL2 pendiente de instalar (sesión dedicada, sin presión de proyecto).

---

## PRÓXIMO PLIEGO DISPONIBLE: 004

---

## BUGS ACTIVOS (por orden de prioridad)

**Bug 1 — markDropSeen nunca se llama** ← CRÍTICO para experiencia Edu/David
`onMarkDropSeen` no está cableado en App.jsx. El mismo Drop aparece cada vez que se abre la app.
Ver ROADMAP.md para el fix exacto (10 líneas en App.jsx).

**Bug 2 — HeartbeatWidget usa umbral 20 meses, CONFIG usa 18**
Inconsistencia menor. Vault.jsx vs GoogleDriveService.js. Fix: extraer constante al contexto.

**Bug 3 — Esquinas decorativas en recuadros**
Todos los recuadros tienen un cuadradito en cada esquina. Eliminar del diseño.
Archivos probables: Layout.jsx, App.css o clases Tailwind en componentes visuales.

**Bug 4 — MusicLab sin feedback visual al añadir track**
El reproductor no muestra progreso cuando se añade un track. El usuario no sabe cuándo está listo.
Archivo: MusicLab.jsx

---

## INFRAESTRUCTURA PENDIENTE

- [ ] (CRÍTICO) Crear carpeta compartida `el_bunker_db` en el Drive de thebunker.admin, invitar a bansovi.py y dcgdozt como Editores.
- [ ] Añadir `VITE_GOOGLE_SHARED_FOLDER_ID` al `.env` local con el ID de la carpeta compartida.
- [ ] Aplicar PLIEGOS 001, 002 y 003 (en el mismo commit) y hacer Clear Site Data en el navegador antes de probar.
- [ ] Crear repositorio privado en GitHub y conectarlo al repo local
- [ ] Verificar configuración de Google Cloud Console (3 usuarios de prueba, scopes correctos)
- [ ] Deploy en Vercel con VITE_GOOGLE_CLIENT_ID y VITE_GOOGLE_SHARED_FOLDER_ID como variables de entorno
- [ ] Añadir URL de producción a orígenes autorizados en Google Cloud Console
- [ ] Instalar PWA en Android de Edu
- [ ] Instalar PWA en Android de David
- [ ] Instalar WSL2 + Ubuntu 24.04 (sesión dedicada)

---

## FEATURES CONFIRMADAS (orden de implementación)

### MusicLab
- [ ] A · Tags predefinidos (DNB, 420 Chill, Lofi, Rap, Ambient, Reggaeton) — editables desde la app
- [ ] B · Cola de reproducción con drag & drop
- [ ] C · Historial de escucha (quién, cuándo, contador de reproducciones)
- [ ] D · Modo shuffle por tag
- [ ] E · Notas por track
- [ ] F · Tags de música con color personalizado
- [ ] G · Playlists
- [ ] H · Crossfade configurable entre tracks
- [ ] I · Sleep timer
- [ ] J · Gapless playback
- [ ] K · Contador con fecha de primer play
- [ ] L · "La canción de esta era" — conecta MusicLab con Vault
- [ ] M · Modo Party / Pantalla compartida con visualizador

### Vault
- [ ] N · Adjuntar foto directamente a una entrada (guardada en Drive)
- [ ] O · Mapa de memorias con localización
- [ ] P · Entrada rápida desde Android shortcut (PWA shortcuts)
- [ ] Q · Mood/estado de ánimo en cada entrada (personalizable)
- [ ] R · Notificación "hace un año"
- [ ] S · Reacciones a entradas con emojis personalizados
- [ ] T · Entradas fijadas
- [ ] U · Búsqueda full-text global

### Global
- [ ] V · Más personalización visual en menús
- [ ] W · Temas visuales alternativos (CSS variables + tema años 2000s)
- [ ] X · Pantalla "Hoy" en home
- [ ] Y · Prompts semanales (JSON estático, sin backend)
- [ ] Z · Modo lectura / "Leer el vault juntos"
- [ ] AA · Perfil de usuario personalizable
- [ ] AB · "Este día en la historia" en home

---

## RAZONAMIENTOS CLAVE

**Por qué Google Drive y no base de datos:**
App privada para dos personas. Sin Drive habría que pagar infraestructura. Con Drive los datos son de los usuarios y viven en su propio almacenamiento. Sin costes operativos.

**Por qué PWA y no app nativa:**
Ambos usuarios en Android. Una PWA instalable cubre el 90% de la experiencia nativa sin coste de desarrollo ni publicación en Play Store.

**Por qué el deploy estaba bloqueado:**
La URL de producción tiene que estar en los orígenes autorizados de Google Cloud Console antes de que OAuth funcione fuera de localhost. Paso crítico que no puede saltarse.

**Por qué un Pliego por archivo:**
Qwen pierde el hilo cuando se le pide tocar varios archivos a la vez. Un Pliego = un archivo = un commit verificable.