# GUÍA DE CUENTAS — EL BÚNKER
> Cuentas Gmail, jerarquía de roles, configuración OAuth y bibliotecas de almacenamiento.

---

## JERARQUÍA DE CUENTAS

### ROL A — ADMIN
**Cuenta:** `thebunker.admin@gmail.com`
- Registra la app en Google Cloud Console
- Es el OAuth "dueño": la app inicia sesión con esta cuenta
- `the_vault_database.json` se guarda en el appDataFolder de ESTA cuenta
- Gestiona las cuentas biblioteca desde dentro de la app

### ROL B — USUARIOS
**Cuentas:** `bansovi.py@gmail.com` (Edu) y `dcgdozt@gmail.com` (David)
- Emails personales ya existentes
- La app los reconoce por email para diferenciar mensajes/medios
- No necesitan ningún permiso especial en Drive

### ROL C — BIBLIOTECAS
Cuentas Gmail creadas exclusivamente para almacenamiento (15 GB gratis cada una).
La app NUNCA inicia sesión en estas cuentas — solo lee sus carpetas compartidas usando el token del Admin.

**Bibliotecas actuales:**
| Cuenta | Tipo | Estado |
|---|---|---|
| *(pendiente de crear)* | música | — |
| *(pendiente de crear)* | fotos | — |

---

## CONFIGURACIÓN DE GOOGLE CLOUD CONSOLE

**Proyecto:** "El Bunker"
**APIs habilitadas:** Google Drive API
**Tipo de aplicación:** Aplicación web
**Orígenes JS autorizados:**
- `http://localhost:5173` (desarrollo)
- *(añadir URL de producción Vercel cuando se haga el deploy)*

**Scopes configurados:**
```
openid
email
profile
https://www.googleapis.com/auth/drive.appdata
```

**Usuarios de prueba (pantalla consentimiento OAuth):**
```
thebunker.admin@gmail.com
bansovi.py@gmail.com
dcgdozt@gmail.com
```
⚠️ Mientras la app esté en modo "prueba" (no publicada), SOLO estos 3 emails pueden hacer login.

---

## CÓMO AÑADIR UNA BIBLIOTECA DE ALMACENAMIENTO

1. Crear cuenta Gmail nueva (ej: `elbunker.musica1@gmail.com`)
2. Entrar a Drive con esa cuenta
3. Crear carpeta "BUNKER_MUSICA" (o BUNKER_FOTOS)
4. Compartir la carpeta con `thebunker.admin@gmail.com` (permiso: Editor)
5. Copiar el ID de la carpeta (parte de la URL después de `/folders/`)
6. Dentro de la app (logueado como Admin) → sección bibliotecas → Añadir biblioteca
7. Rellenar: email, tipo, etiqueta, ID carpeta, capacidad (usar 14 GB para tener margen)

---

## MANTENIMIENTO — HEARTBEAT DE BIBLIOTECAS

Google cierra cuentas inactivas tras ~2 años sin login. Si ocurre, se pierden todos los archivos de esa biblioteca.

**Alertas de la app:**
- 🟡 **AT RISK:** 18 meses sin login → entrar YA
- 🔴 **LOST:** 23 meses → posible pérdida

**Rutina anual (poner recordatorio en calendario):**
1. Entrar a Gmail/Drive con cada cuenta biblioteca
2. Hacer cualquier acción (subir archivo de 1KB, borrarlo)
3. En la app → sección bibliotecas → botón "Heartbeat ✓"

---

## CUANDO UNA BIBLIOTECA SE LLENA

La app avisa al llegar al 90% (amarillo) o 100% (rojo).

1. Crear nueva cuenta Gmail (ej: `elbunker.musica2@gmail.com`)
2. Crear carpeta y compartir con Admin (mismo proceso que arriba)
3. Añadir la nueva biblioteca en la app
4. Las dos bibliotecas del mismo tipo coexisten — la app gestiona dónde guardar los nuevos archivos
