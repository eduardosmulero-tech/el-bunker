# TUTORIAL: EL PICADOR LOCAL — GUÍA COMPLETA
### Sistema de IA para El Búnker · Mayo 2026

---

## QUÉ ES ESTE SISTEMA Y POR QUÉ FUNCIONA ASÍ

El sistema tiene dos capas que trabajan juntas:

**Claude (El Arquitecto)** — Es esta IA con la que hablas en claude.ai. Conoce toda la arquitectura del proyecto, detecta errores de lógica, diseña soluciones y genera instrucciones precisas. Su limitación es que no puede tocar tus archivos directamente.

**Picador Local (qwen3:14b en tu RTX 4070)** — Es la IA que corre en tu máquina dentro de VS Code a través de Continue. Su trabajo es recibir instrucciones exactas y ejecutarlas: leer archivos, escribir código, editar funciones. Corre gratis, offline y sin límite de tokens porque edita el archivo directamente en lugar de escribir en el chat.

**El flujo en la práctica:**
```
Tú le describes el problema a Claude
    → Claude diseña la solución y genera un prompt preciso (añadir lineas o qwen no respondera bien, comprobado)
        → Tú pegas ese prompt en Continue (Ctrl+L)
            → El Picador edita el archivo automáticamente
                → Tú confirmas o reportas el resultado a Claude
```

---

## PARTE 1 — VERIFICAR QUE TODO FUNCIONA

### Test 1 — Comprobar que el Picador está activo

1. Abre VS Code con el proyecto El Búnker
2. En la barra lateral izquierda busca el icono de Continue (parece dos corchetes `>>`)
3. Haz clic — se abre el panel de chat
4. Abajo del panel verás el modelo activo. Debe decir **"Picador Local"**
5. Si dice otra cosa, haz clic en el nombre del modelo y selecciona "Picador Local"

### Test 2 — Comprobar que Ollama está corriendo

Abre el terminal de VS Code (`Ctrl+Ñ`) y escribe:
```bash
curl http://localhost:11434
```
Debe responder: `Ollama is running`

Si no responde, abre la aplicación Ollama desde el menú de inicio de Windows y espera 10 segundos.

### Test 3 — Comprobar que el Agent puede leer archivos (SIN modificar nada)

En el panel de Continue, asegúrate de que el modo sea **Agent** (no Chat). Hay un selector justo encima del campo de texto — debe decir "Agent". Si dice "Chat", cámbialo.

Escribe exactamente esto:
```
@codebase Lista los archivos que hay en la carpeta src/ sin modificar nada
```

**Qué esperar:** El Picador debe responder listando los archivos .jsx y .js que hay en src/. Si lo hace, el Agent funciona correctamente con acceso al proyecto.

**Si falla con "file not accessible":** Asegúrate de haber abierto VS Code directamente en la carpeta raíz del proyecto (`el-bunker/`), no en una carpeta superior. Usa Archivo → Abrir Carpeta y selecciona la carpeta `el-bunker`.

### Test 4 — Comprobar que el Agent puede usar tools

En el panel de Continue en modo **Agent**, escribe:
```
Lee el archivo src/GoogleDriveService.js y dime cuántas funciones exportadas tiene. No modifiques nada.
```

**Qué esperar:** El Picador debe leer el archivo y responder con un número y una lista de funciones. Si lo hace, las tools de lectura funcionan.

### Test 5 — Comprobar el autocomplete (Tab)

1. Abre cualquier archivo .jsx del proyecto
2. Ve a una línea vacía dentro de una función
3. Empieza a escribir `const ` y para
4. Después de 1-2 segundos debe aparecer una sugerencia en gris
5. Pulsa `Tab` para aceptarla

Si aparece la sugerencia, el autocomplete con qwen2.5-coder:1.5b funciona.

---

## PARTE 2 — LOS DOS MODOS DE USO

### MODO A — Ctrl+L (Agent Chat) ← El más importante

**Cuándo usarlo:** Cuando quieres que el Picador realice una tarea completa — leer un archivo, entender su contexto y hacer una modificación.

**Cómo funciona:**
1. Pulsa `Ctrl+L` — se abre el panel de Continue
2. Asegúrate de que dice **"Agent"** arriba (no "Chat")
3. Escribe o pega el prompt de Claude
4. Pulsa `Enter`
5. El Picador lee los archivos necesarios y propone los cambios
6. Aparece un diff (comparación antes/después) con un botón **"Apply"**
7. Revisas el diff y pulsas **"Apply"** si es correcto

**Regla de oro:** Si el Picador te muestra un diff y parece razonable, acepta. Si hace algo completamente diferente a lo esperado, escribe "Undo" en el chat o usa `Ctrl+Z` en el editor.

### MODO B — Ctrl+I (Inline Edit) ← Para ediciones pequeñas y precisas

**Cuándo usarlo:** Cuando ya tienes el cursor en el lugar exacto donde quieres el cambio y la tarea es concreta y pequeña (insertar una función, cambiar un valor, añadir una línea).

**Cómo funciona:**
1. Abre el archivo en el editor
2. **Selecciona con el ratón el bloque de código relevante** (por ejemplo, toda una función)
3. Pulsa `Ctrl+I`
4. Escribe la instrucción corta
5. El Picador modifica solo lo seleccionado

**Ejemplo práctico:**
- Seleccionas la función `addDrop` completa
- Pulsas `Ctrl+I`
- Escribes: "Después de esta función, añade `markDropSeen` con el mismo patrón de updateData"
- El Picador inserta el código justo después

---

## PARTE 3 — CÓMO ESCRIBIR BUENOS PROMPTS PARA EL PICADOR

El Picador no es Claude — no razona sobre arquitectura ni detecta problemas de diseño. Necesita instrucciones directas y concretas. Claude genera estos prompts por ti, pero es útil entender qué hace que un prompt funcione bien.

### Estructura de un prompt eficaz

```
[Archivo objetivo] + [Referencia a código existente] + [Qué hacer] + [Patrón a seguir]
```

**Ejemplo malo:**
> "Añade markDropSeen al proyecto"

**Ejemplo bueno:**
> "En src/GoogleDriveService.js, después de la función addDrop, inserta una nueva función exportada llamada markDropSeen. Recibe un dropId, usa updateData con el mismo patrón que addDrop, y actualiza el drop con ese id poniendo seen:true en db.music_lab.drops. Después añádela al objeto GoogleDriveService del export default al final del archivo."

La diferencia: archivo exacto, referencia a código que ya existe, acción concreta, patrón a copiar.

### Prefijos útiles en los prompts

- `@codebase` — Le da al Picador acceso al índice de todo el proyecto. Úsalo cuando la tarea afecta a varios archivos o cuando el Picador necesita entender el contexto global.
- `@file src/GoogleDriveService.js` — Le dice al Picador que se centre en ese archivo específico. Más rápido que @codebase para tareas de un solo archivo.

**Ejemplo con prefijo:**
> "@file src/App.jsx En el bloque donde se renderiza MusicLab, añade la prop onMarkDropSeen después de onAddDrop"

### Señales de que el prompt va a fallar

- No menciona ningún archivo concreto → el Picador no sabe dónde buscar
- Solo describe intención ("quiero que funcione el sistema de drops") → demasiado vago
- Pide varias cosas no relacionadas en un solo prompt → el Picador pierde el hilo

---

## PARTE 4 — QUÉ HACER CUANDO EL PICADOR FALLA

### Fallo 1 — "File not accessible" o no encuentra el archivo

**Causa:** VS Code no está abierto en la carpeta raíz del proyecto, o el Agent no ha indexado el codebase aún.

**Solución:**
1. Comprueba que la raíz del workspace sea `el-bunker/` (aparece en la barra inferior de VS Code)
2. En el panel de Continue, haz clic en los tres puntos `···` → "Sync Codebase Index"
3. Espera 30 segundos y reintenta
4. Si persiste, añade `@file src/NombreDelArchivo.js` al principio del prompt

### Fallo 2 — El Picador lee pero no escribe nada

**Causa:** El modelo entró en modo de razonamiento (thinking) o el prompt era demasiado ambiguo.

**Solución:**
1. Escribe en el chat como follow-up: "Ahora aplica los cambios en el archivo"
2. Si sigue sin actuar, cierra el chat (`Esc`), abre uno nuevo (`Ctrl+L`) y reescribe el prompt siendo más imperativo: empieza con un verbo directo ("Abre... Inserta... Añade...")

### Fallo 3 — El Picador hace algo completamente diferente a lo pedido

**Causa:** El contexto del chat anterior está contaminando la respuesta.

**Solución:**
1. Pulsa el icono de papelera o `+` en el panel de Continue para abrir un chat nuevo limpio
2. Reintenta el prompt desde cero

### Fallo 4 — Apply funciona pero el código tiene errores de sintaxis

**Causa:** El Picador generó código incompleto o con un typo.

**Solución:**
1. Usa `Ctrl+Z` para deshacer el cambio
2. Reporta a Claude exactamente qué generó el Picador (copia el código)
3. Claude corregirá el prompt y lo volverás a lanzar

### Fallo 5 — Ollama no responde o va muy lento

**Causa:** El modelo se descargó de VRAM o hay otro proceso usando la GPU.

**Solución:**
1. Abre el terminal y ejecuta: `ollama run qwen3:14b` para forzar la carga en VRAM
2. Escribe `/bye` para salir del modo interactivo — el modelo queda cargado en memoria
3. Cierra otros programas que usen GPU (juegos, otros modelos, etc.)
4. Verifica en el Administrador de tareas → GPU que Ollama aparece usando VRAM

---

## PARTE 5 — EL FLUJO COMPLETO DE UNA SESIÓN REAL

Así es como se trabaja en la práctica, de principio a fin:

**1. Inicio de sesión**
- Abre Ollama (si no está corriendo)
- Abre VS Code en la carpeta `el-bunker/`
- Comprueba que el panel de Continue muestra "Picador Local"

**2. Abres una conversación con Claude**
- Le das contexto: qué quieres hacer, qué módulo tocas
- Claude diseña la lógica y te entrega un prompt listo

**3. Ejecutas en el Picador**
- `Ctrl+L` en VS Code
- Modo "Agent" activado
- Pegas el prompt de Claude
- `Enter`
- Revisas el diff y pulsas "Apply"

**4. Verificas**
- Abres el archivo modificado y lees el código nuevo
- Si ves algo raro, reportas a Claude con una captura o copiando el código
- Si se ve bien, guardas (`Ctrl+S`) y pasas al siguiente prompt

**5. Prueba en el navegador**
- `npm run dev` en el terminal
- Compruebas que la funcionalidad nueva funciona
- Si hay error en consola, lo reportas a Claude

---

## PARTE 6 — REFERENCIA RÁPIDA DE ATAJOS

| Acción | Atajo |
|---|---|
| Abrir chat del Picador | `Ctrl+L` |
| Edición inline en selección | `Ctrl+I` |
| Enviar prompt | `Enter` |
| Chat nuevo (limpiar contexto) | Icono `+` en el panel |
| Deshacer cambio del Picador | `Ctrl+Z` en el editor |
| Abrir terminal VS Code | `Ctrl+Ñ` |
| Guardar archivo | `Ctrl+S` |

---

## PARTE 7 — PENDIENTES DEL PROYECTO (PRÓXIMA SESIÓN)

Estado real al cerrar esta sesión de configuración:

**Completado hoy:**
- ✅ Modelo actualizado a qwen3:14b con tool calling nativo
- ✅ Config.yaml completo con roles, tools, embeddings y reglas de proyecto
- ✅ Autocomplete separado con modelo ligero (qwen2.5-coder:1.5b)
- ✅ nomic-embed-text para indexado de codebase

**Pendiente — Music Lab (M-01 y M-02, CRÍTICO):**
- ❌ Insertar `markDropSeen` en `src/GoogleDriveService.js` después de `addDrop`
- ❌ Añadir `markDropSeen` al export default de GoogleDriveService
- ❌ Pasar prop `onMarkDropSeen` desde `App.jsx` al componente `<MusicLab>`

**Pendiente — Vault / Fotos (P-01, CRÍTICO):**
- ❌ Crear función `uploadPhotoToDrive(file, eraId)` en GoogleDriveService.js
- ❌ UI de subida de foto en EraDetailPanel
- ❌ Galería de fotos por Era

**Para empezar la próxima sesión:**
Dale a Claude este contexto al abrir la conversación:
> "Proyecto El Búnker, React + Tailwind v3 + Google Drive API. El Picador Local (qwen3:14b + Continue) ya funciona correctamente. Pendiente: insertar markDropSeen en GoogleDriveService.js (M-01) y cablear onMarkDropSeen en App.jsx (M-02). Después atacamos P-01 uploadPhotoToDrive."

---

*Tutorial generado en sesión Mayo 2026 · Arquitecto: Claude Sonnet 4.6 · Picador: qwen3:14b via Ollama*
