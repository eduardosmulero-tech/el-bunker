# Manual de Usuario — Hermes AI Assistant

> **Sistema:** Hermes AI agent framework sobre WSL2 (Ubuntu) + Ollama + Freebuff  
> **Usuario:** Edu  
> **Perfiles:** Principal · Código · Nocturno  
> **Última verificación:** Junio 2026

---

## Índice

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Componentes Base](#2-componentes-base)
3. [Perfil Principal (Hub Central)](#3-perfil-principal-hub-central)
4. [Perfil Código (Especialista Técnico)](#4-perfil-código-especialista-técnico)
5. [Perfil Nocturno (Síntesis Automática)](#5-perfil-nocturno-síntesis-automática)
6. [Hub.py — Router Inteligente](#6-hubpy--router-inteligente)
7. [Scripts de Arranque y Parada](#7-scripts-de-arranque-y-parada)
8. [Gateway de Telegram](#8-gateway-de-telegram)
9. [Uso Diario](#9-uso-diario)
10. [Solución de Problemas](#10-solución-de-problemas)
11. [Referencia Rápida](#11-referencia-rápida)

---

## 1. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    WSL2 Ubuntu                           │
│                                                         │
│  ┌──────────────┐      ┌──────────────────────────┐    │
│  │   Ollama      │      │   Hermes AI Framework     │    │
│  │  localhost:11434│    │                           │    │
│  │              │      │  ┌──────────────────────┐ │    │
│  │ qwen3:14b    │     │  │  Perfil PRINCIPAL    │ │    │
│  │ qwen3:8b     │      │  │  (Hub Central)       │ │    │
│  └──────────────┘      │  │  Gateway Telegram    │ │    │
│         │              │  └──────────────────────┘ │    │
│         ▼              │         │                 │    │
│  ┌──────────────┐      │         ▼                 │    │
│  │   hub.py     │◄─────│  ┌──────────────────────┐ │    │
│  │  localhost:8000│    │  │  Perfil CÓDIGO       │ │    │
│  │  Router IA   │─────►│  │  (Especialista Téc.) │ │    │
│  └──────────────┘      │  └──────────────────────┘ │    │
│         │              │         │                 │    │
│         ▼              │         ▼                 │    │
│  ┌──────────────┐      │  ┌──────────────────────┐ │    │
│  │   Freebuff    │      │  │  Perfil NOCTURNO     │ │    │
│  │  DeepSeek API │      │  │  (Síntesis 3 AM)     │ │    │
│  └──────────────┘      │  └──────────────────────┘ │    │
│                        │         │                 │    │
│  ┌──────────────┐      │         ▼                 │    │
│  │   Piper TTS   │      │  ~/.hermes/sintesis/     │    │
│  │   (local)     │      │  ~/.hermes/dataset/      │    │
│  └──────────────┘      │  ~/.hermes/logs/          │    │
│                        └──────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Flujo de una consulta

```
Usuario escribe → Perfil PRINCIPAL (procesa)
                    │
                    ├─ Tema técnico → Sugiere cambiar a CÓDIGO
                    │                   │
                    │                   └─ CÓDIGO llama a hub.py
                    │                       │
                    │                       ├─ "local"   → Ollama qwen3:14b
                    │                       ├─ "flash"   → DeepSeek Flash vía Freebuff
                    │                       ├─ "pro"     → DeepSeek Pro vía Freebuff (5/día)
                    │                       └─ "oi"      → Open Interpreter + Ollama
                    │
                    └─ Tema personal → Responde directamente
                    
(3 AM) → Nocturno procesa conversaciones.jsonl
         → Genera síntesis del día en sintesis/
         → Extrae entradas premium para fine-tuning en dataset/
```

---

## 2. Componentes Base

### 2.1 Ollama (Modelos Locales)

Ollama corre como servicio en segundo plano sirviendo modelos en `localhost:11434`.

**Modelos disponibles:**

| Modelo | Uso | Perfil |
|--------|-----|--------|
| `qwen3:14b` | Motor principal (14B) | Principal, Código |
| `qwen3:8b` | Síntesis nocturna | Nocturno |
| `qwen14-estudio:latest` | Alternativa (14B) | — |

**Comandos útiles:**
```bash
ollama list                    # Modelos disponibles
ollama pull qwen3:14b          # Descargar modelo
curl localhost:11434           # Verificar que Ollama responde
```

### 2.2 Hermes AI Framework

Framework de agente de IA instalado globalmente. Gestión de perfiles, gateway, y ejecución.

**Comandos básicos:**
```bash
hermes --help                  # Ayuda general
hermes profile list            # Listar perfiles
hermes principal chat          # Iniciar chat con perfil Principal
hermes --profile codigo chat   # Chat con perfil Código
```

### 2.3 Freebuff (Acceso a DeepSeek)

CLI para acceder a modelos cloud (DeepSeek V4 Flash y Pro). Instalado en WSL.

```bash
freebuff                       # Iniciar CLI interactiva
```

> **Importante:** Freebuff se lanza desde WSL. Si el binario está en Windows (`AppData/Roaming/npm/freebuff`), asegúrate de que sea accesible desde WSL. El hub.py ya tiene la ruta configurada.

### 2.4 Piper TTS (Voz Local)

Sistema de texto a voz local con voz española.

**Modelo instalado:** `es_ES-davefx-medium` en `~/piper-voices/`

```bash
# Probar TTS
echo "Hola, soy tu asistente" | piper \
  --model ~/piper-voices/es_ES-davefx-medium.onnx \
  --output_file /tmp/test.wav
```

### 2.5 Groq Whisper (STT)

Transcripción de notas de voz (`.ogg`) usando Groq Whisper.

**Endpoint:** `https://api.groq.com/openai/v1/audio/transcriptions`  
**Modelo:** `whisper-large-v3-turbo`

---

## 3. Perfil Principal (Hub Central)

### Identidad

El Principal es el **hub central**, el punto de entrada único para Edu. Atiende en español, gestiona notas, sugiere cambiar al Código para temas técnicos, y ejecuta scripts solo con confirmación.

### Archivos de Configuración

| Archivo | Ruta |
|---------|------|
| Config | `~/.hermes/profiles/principal/config.yaml` |
| Personalidad | `~/.hermes/profiles/principal/SOUL.md` |

### Capacidades

- **Chat interactivo** en tiempo real
- **/nota** — indexa y guarda notas con fecha y etiquetas automáticas
- **Diagramas Mermaid** — genera mapas de ideas visuales
- **Detecta temas técnicos** — sugiere cambiar al perfil Código
- **TTS** — responde con voz por Telegram (Piper)
- **STT** — transcribe audios de Telegram (Groq Whisper)
- **Gateway Telegram** — punto de entrada desde Telegram

### Uso

```bash
hermes principal chat          # Iniciar sesión
hermes principal gateway start # Arrancar gateway Telegram
```

---

## 4. Perfil Código (Especialista Técnico)

### Identidad

El Código es el **especialista técnico** de Hermes. Trabaja exclusivamente con el proyecto "El Búnker" y es convocado por el Principal cuando detecta temas de código.

### Archivos de Configuración

| Archivo | Ruta |
|---------|------|
| Config | `~/.hermes/profiles/codigo/config.yaml` |
| Personalidad | `~/.hermes/profiles/codigo/SOUL.md` |

### Workflow (Obligatorio)

1. **Leer CONTRATO.md** del proyecto antes de generar código
2. **Llamar a hub.py** (`POST localhost:8000/prompt`) para decidir la ruta
3. **Mostrar:** `"Resolviendo con: [local/flash/pro/oi]"`
4. **Razonar** en voz alta antes de proponer solución
5. **Confirmar** antes de ejecutar comandos en terminal

### Modos de Ejecución

| Ruta | Motor | Límite |
|------|-------|--------|
| `local` | Ollama qwen3:14b | Ilimitado |
| `flash` | DeepSeek V4 Flash vía Freebuff | Ilimitado |
| `pro` | DeepSeek V4 Pro vía Freebuff | 5/día |
| `oi` | Open Interpreter + Ollama | Ilimitado |

### Uso

```bash
hermes --profile codigo chat   # Iniciar chat técnico
```

---

## 5. Perfil Nocturno (Síntesis Automática)

### Identidad

El Nocturno **no es interactivo**. Se ejecuta automáticamente a las 3 AM para procesar el día, generar síntesis y extraer datos para fine-tuning.

### Archivos de Configuración

| Archivo | Ruta |
|---------|------|
| Config | `~/.hermes/profiles/nocturno/config.yaml` |
| Personalidad | `~/.hermes/profiles/nocturno/SOUL.md` |
| Script | `~/.hermes/nocturno_run.py` |

### Pipeline Nocturno

```
1. Leer ~/.hermes/conversaciones.jsonl del día
2. Enviar a qwen3:8b vía Ollama para análisis
3. Generar ~/.hermes/sintesis/YYYY-MM-DD.md:
   - Resumen ejecutivo (3-5 líneas)
   - Errores detectados
   - Temas tratados
   - Métricas (sesiones Pro, ruta más frecuente)
4. Extraer entradas "pro" y "flash" → dataset/premium.jsonl
5. Backup de conversaciones → sintesis/YYYY-MM-DD.jsonl
6. Log en ~/.hermes/logs/nocturno.log
```

### Automatización

El Nocturno se ejecuta mediante **systemd timer**:

```bash
# Archivos de servicio
~/.config/systemd/user/nocturno.service
~/.config/systemd/user/nocturno.timer

# Ver estado
systemctl --user status nocturno.timer
systemctl --user status nocturno.service

# Ver último registro
cat ~/.hermes/logs/nocturno.log
```

### Ejecución Manual

```bash
python3 ~/.hermes/nocturno_run.py
```

---

## 6. Hub.py — Router Inteligente

### Descripción

`hub.py` es un servidor **FastAPI** en `localhost:8000` que clasifica prompts y los enruta al motor más adecuado. Es el cerebro del sistema.

### Archivo

| Atributo | Valor |
|----------|-------|
| Ruta | `~/.hermes/hub.py` |
| Puerto | 8000 |
| Framework | FastAPI |
| Log | `~/.hermes/conversaciones.jsonl` |

### Endpoints

#### `POST /prompt`
Enruta un prompt al motor adecuado.

```bash
curl -X POST localhost:8000/prompt \
  -H "Content-Type: application/json" \
  -d '{"texto": "Hazme un refactor del modulo de autenticacion"}'
```

**Respuesta:**
```json
{
  "ruta": "flash",
  "resultado": "...",
  "sesiones_restantes": 5
}
```

#### `GET /sesiones`
Estado de sesiones Pro del día.

```bash
curl localhost:8000/sesiones
```

**Respuesta:**
```json
{
  "fecha": "2026-06-09",
  "usadas": 0,
  "restantes": 5
}
```

#### `GET /health`
Estado del sistema.

```bash
curl localhost:8000/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "ollama": true,
  "freebuff": true
}
```

### Lógica de Rutas

| Palabras clave | Ruta | Motor |
|----------------|------|-------|
| ejecuta, bash, instala, terminal, script, lanza, abre | `oi` | Open Interpreter |
| arquitectura, diseño, refactor, estructura, sistema, SOLID | `pro` | DeepSeek Pro (5/día) |
| código, función, bug, error, api, implementa, optimiza | `flash` | DeepSeek Flash |
| (cualquier otro) | `local` | Ollama qwen3:14b |

### Fallbacks

- Freebuff timeout → automático a Ollama local
- Sesiones Pro agotadas → Flash automáticamente
- Ollama no disponible → HTTP 503

---

## 7. Scripts de Arranque y Parada

### `~/hermes_start.sh` — Arrancar el Sistema

Arranca todos los componentes en orden:

```
PASO 1: Verificar/arrancar Ollama (localhost:11434)
PASO 2: Verificar modelo qwen14-estudio
PASO 3: Verificar/arrancar Hub.py (puerto 8000)
PASO 4: Verificar/arrancar Gateway Telegram
PASO 5: Mostrar reporte de estado

┌─────────────────────────────────────┐
│ Hermes — estado del sistema         │
├─────────────────────────────────────┤
│ Ollama      : OK                    │
│ qwen14-estudio: OK                  │
│ Hub.py      : OK (puerto 8000)      │
│ Gateway     : OK                    │
│ Sesiones Pro: 5/5 restantes hoy     │
└─────────────────────────────────────┘
```

```bash
~/hermes_start.sh
```

### `~/hermes_stop.sh` — Parar el Sistema

Para todos los componentes limpiamente:

- Gateway Telegram (por PID)
- Hub.py (por pgrep)
- Procesos residuales de gateway
- **Ollama se deja corriendo** (no se para)

```bash
~/hermes_stop.sh
```

---

## 8. Gateway de Telegram

### Estado Actual

El gateway de Telegram debe estar migrado del perfil `default` al perfil `principal`. Verificar:

```bash
# Ver perfil default (extraer token)
cat ~/.hermes/profiles/default/config.yaml | grep -A 10 telegram

# Ver perfil principal (debe tener el token)
cat ~/.hermes/profiles/principal/config.yaml | grep -A 10 telegram
```

### Arrancar Gateway

```bash
hermes principal gateway start
```

### Verificar desde Telegram

Manda un mensaje al bot desde Telegram. Debe responder:
- En español
- Presentándose como el hub central
- Sin errores de API key

### Solución si el gateway no responde

```bash
# 1. Ver estado
cat ~/.hermes/gateway.state.json  # Si no existe, no está activo

# 2. Ver logs
cat ~/.hermes/logs/gateway.log | tail -50

# 3. Si hay error de autenticación, verificar token
# El token está en la sección telegram: del config.yaml del perfil
```

---

## 9. Uso Diario

### Arranque Matutino

```bash
# Un solo comando
~/hermes_start.sh
```

### Durante el Día

```bash
# Chat directo con el Principal
hermes principal chat

# Si el Principal detecta tema técnico, sugerirá cambiar a Código
hermes --profile codigo chat

# Ver estado del sistema
curl localhost:8000/health

# Ver sesiones Pro restantes
curl localhost:8000/sesiones
```

### Notas Rápidas

Dentro del chat del Principal, usa el comando:

```
/nota Recordar que mañana tengo reunion a las 10
```

El Principal indexará la nota con fecha y etiquetas automáticas.

### Cierre

```bash
~/hermes_stop.sh
```

### Automático (3 AM)

El Nocturno procesa el día automáticamente. Para ver los resultados:

```bash
cat ~/.hermes/sintesis/$(date +%Y-%m-%d).md
```

---

## 10. Solución de Problemas

### 10.1 El perfil Principal sigue usando Groq en vez de Ollama

**Síntoma:** Error HTTP 413 o mensaje de TPM limit  
**Solución:** Verificar que el config del Principal use `provider: custom` y `base_url: http://localhost:11434/v1`

```bash
cat ~/.hermes/profiles/principal/config.yaml | grep -A 10 "^model:"
```

Si aparece `provider: groq`, editarlo.

### 10.2 "Provider resolver returned an empty API key"

**Síntoma:** Error al iniciar chat  
**Causa:** Ollama local no necesita API key, pero Hermes puede requerir un token dummy  
**Solución:** Añadir al config del perfil:

```yaml
api_key: "ollama"
```

### 10.3 Hub.py no arranca

```bash
# Verificar logs
cat ~/.hermes/logs/hub.log | tail -20

# Arrancar manualmente para ver errores
uvicorn hub:app --host 127.0.0.1 --port 8000
```

### 10.4 Freebuff no encontrado

**Síntoma:** `/health` devuelve `freebuff: false`  
**Solución:** Verificar que la ruta en hub.py es correcta:

```bash
which freebuff
# o
ls -la /mnt/c/Users/eduar/AppData/Roaming/npm/freebuff
```

### 10.5 El Nocturno no se ejecuta

```bash
# Ver estado del timer
systemctl --user status nocturno.timer

# Ver logs
cat ~/.hermes/logs/nocturno.log

# Probar ejecución manual
python3 ~/.hermes/nocturno_run.py
```

### 10.6 El gateway de Telegram no responde

```bash
# Verificar si está corriendo
cat ~/.hermes/gateway.pid 2>/dev/null
ps aux | grep hermes.*gateway

# Ver logs
cat ~/.hermes/logs/gateway.log | tail -50

# Reiniciar
~/hermes_stop.sh
~/hermes_start.sh
```

### 10.7 El modelo qwen3:14b no está disponible

**Estado actual:** ✅ `qwen3:14b` descargado y configurado en Principal y Código.  
**Solución:** Ya está resuelto. Si en el futuro necesitas restaurar `qwen14-estudio`:

```bash
ollama pull qwen14-estudio:latest
sed -i 's/qwen3:14b/qwen14-estudio:latest/g' ~/.hermes/profiles/principal/config.yaml
sed -i 's/qwen3:14b/qwen14-estudio:latest/g' ~/.hermes/profiles/codigo/config.yaml
```

---

## 11. Referencia Rápida

### Estructura de Archivos

```
~/.hermes/
├── config.yaml                 # Configuración global
├── hub.py                      # Router FastAPI
├── nocturno_run.py             # Script de síntesis nocturna
├── sessions.json               # Contador sesiones Pro
├── conversaciones.jsonl        # Log del día (ChatML)
├── profiles/
│   ├── principal/
│   │   ├── config.yaml         # Config del Principal
│   │   └── SOUL.md             # Personalidad del Principal
│   ├── codigo/
│   │   ├── config.yaml         # Config del Código
│   │   └── SOUL.md             # Personalidad del Código
│   └── nocturno/
│       ├── config.yaml         # Config del Nocturno
│       └── SOUL.md             # Personalidad del Nocturno
├── sintesis/                   # Síntesis nocturnas (YYYY-MM-DD.md)
├── dataset/
│   └── premium.jsonl           # Entradas premium para fine-tuning
└── logs/
    ├── nocturno.log            # Log del Nocturno
    ├── hub.log                 # Log del hub.py
    └── gateway.log             # Log del gateway Telegram

~/hermes_start.sh               # Script de arranque
~/hermes_stop.sh                # Script de parada
```

### Comandos Esenciales

| Comando | Qué hace |
|---------|----------|
| `~/hermes_start.sh` | Arranca todo el sistema |
| `~/hermes_stop.sh` | Para todo (excepto Ollama) |
| `hermes principal chat` | Chat con el Principal |
| `hermes --profile codigo chat` | Chat con el Código |
| `curl localhost:8000/health` | Estado del sistema |
| `curl localhost:8000/sesiones` | Sesiones Pro restantes |
| `python3 ~/.hermes/nocturno_run.py` | Ejecutar Nocturno manualmente |
| `cat ~/.hermes/sintesis/$(date +%Y-%m-%d).md` | Ver síntesis de hoy |
| `systemctl --user status nocturno.timer` | Estado del timer Nocturno |

### Estado de la Configuración (Verificado Junio 2026)

| Componente | Estado | Notas |
|------------|--------|-------|
| Ollama | ✅ OK | `qwen14-estudio`, `qwen3:8b` |
| Perfil Principal | ✅ OK | Config + SOUL.md correctos |
| Perfil Código | ✅ OK | Config + SOUL.md correctos |
| Perfil Nocturno | ✅ OK | Config + SOUL.md + script |
| Hub.py | ✅ OK | 3 endpoints, router funcional |
| Sessions.json | ✅ OK | 0/5 usadas (reseteado) |
| Piper TTS | ✅ OK | Voz española |
| Groq Whisper STT | ✅ OK | vía Groq API |
| hermes_start.sh | ✅ OK | En ~/ |
| hermes_stop.sh | ✅ OK | En ~/ |
| Nocturno timer | ✅ OK | systemd user timer |
| Síntesis nocturna | ✅ OK | Generó 2026-06-09.md |
| Conversaciones.jsonl | ✅ OK | Hub.py loggea correctamente |
| Gateway Telegram | ✅ OK | Corriendo (PID 296), 30 comandos registrados |
| Modelo qwen3:14b | ✅ OK | Descargado y configurado en Principal + Código |
| Freebuff desde WSL | ✅ OK | Accesible desde WSL |

---

> **Documento generado a partir de:** `docs/sesiones/PROMP1.txt`, `PROMP2.txt`, `PROMP3.txt`  
> **Verificación:** Estado real del sistema contrastado contra especificaciones originales  
> **Ubicación:** `docs/operacional/hermes_setup_manual.md`
