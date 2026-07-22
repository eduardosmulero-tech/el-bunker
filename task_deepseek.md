# task_deepseek.md — Encargo vigente para DeepSeek

> Pipeline Promethe-os (MANUAL_PIPELINE_TRABAJO.md).
> Worker: DeepSeek (deepseek-chat). Rol: implementador.
> Contrato según §8: alcance + archivos + prohibiciones + verificación.

---

## 📋 CONTRATO

### Alcance exacto
[descripción de la tarea actual: qué hay que hacer]

### Archivos permitidos
[lista de archivos que puede tocar]

### Prohibiciones
- No modificar archivos fuera de la lista
- No instalar dependencias sin autorización
- No refactorizar código no relacionado

### Verificación
[comando o criterio observable para determinar si está completo]

### Formato de veredicto
PASS: tarea completada según contrato.
RETURN: no completable, contexto faltante.

---

## CONTEXTO DEL PROYECTO

### Identidad
App privada tipo bóveda de memoria + reproductor para pareja (Edu y David).
Serverless: Cloudflare Workers + D1 + R2. Frontend: React/Vite/Tailwind en Vercel.

### Docs normativos
- AGENTS.md — pipeline canónica
- docs/Nucleo/CONTRATO.md — 27 ADRs
- docs/Nucleo/REGLAS.md — workflow

### Stack
Frontend: React 18 + Vite + Tailwind
Backend: Cloudflare Workers + D1 (SQL) + R2 (archivos)
Auth: Google OAuth2
PWA Android (Chrome 90+)

### 🔒 Restricciones
- Motor audio único: MusicLab
- 3 tabs: VAULT · MUSIC LAB · CAPSULES
- Stats engine único: tabla events D1
- Google OAuth2 solo auth
- Cambios por contenedor lógico completo

---

## TAREA VIGENTE

BUG: Canciones repetidas en MusicLab. David reporta duplicados.
Riesgo: límite gratuito Cloudflare excedido → coste.

### Para DeepSeek:
1. Leer workers/routes/tracks.js y src/musiclab/MusicLab.jsx
2. Diagnosticar causa raíz de duplicados
3. Implementar fix
4. Verificar con npm run build

### Criterio de verificación:
- build verde
- No hay tracks duplicados en GET /api/tracks
- El frontend no renderiza duplicados
