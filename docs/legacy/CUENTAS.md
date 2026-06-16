# CUENTAS.md — el_bunker
> Referencia de cuentas, OAuth y bibliotecas. Consultar solo cuando haya problemas de auth o al añadir biblioteca.

---

## CUENTAS Y ROLES

| Cuenta | Rol | Notas |
|---|---|---|
| thebunker.admin@gmail.com | Admin | Dueño OAuth. DB vive en su Drive. |
| bansovi.py@gmail.com | Edu | Usuario normal. |
| dcgdozt@gmail.com | David | Usuario normal. |
| thebunker.musica@gmail.com | Biblioteca música | Carpeta compartida con Admin. La app nunca hace login aquí. |

Whitelist hardcoded en `CONFIG.USERS` de GoogleDriveService.js.

---

## GOOGLE CLOUD CONSOLE

**Proyecto:** El Bunker
**API habilitada:** Google Drive API
**Tipo:** Aplicación web

**Orígenes JS autorizados:**
- `http://localhost:5173`
- `https://el-bunker-beige.vercel.app`

**Scopes configurados:**
```
openid · email · profile
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

**Usuarios de prueba:**
```
thebunker.admin@gmail.com
bansovi.py@gmail.com
dcgdozt@gmail.com
```
⚠️ App en modo Testing — solo estos 3 emails pueden hacer login.

---

## BIBLIOTECAS DE ALMACENAMIENTO

Cuentas Gmail dedicadas solo a almacenamiento (15 GB gratis c/u).
La app nunca inicia sesión en ellas — el Admin accede vía su propio token OAuth.

| Cuenta | Tipo | Carpeta | Estado |
|---|---|---|---|
| thebunker.musica@gmail.com | música | BUNKER_MUSICA | ✅ activa |
| *(pendiente)* | fotos | — | — |

**Alertas de la app:**
- 🟡 AT RISK: 18 meses sin login → entrar ya
- 🔴 LOST: 23 meses → posible pérdida de archivos

**Rutina anual:**
1. Entrar a Gmail/Drive con cada cuenta biblioteca.
2. Hacer cualquier acción (subir 1KB, borrarlo).
3. App → sección bibliotecas → botón "Heartbeat ✓".

---

## AÑADIR BIBLIOTECA NUEVA

1. Crear cuenta Gmail (ej: `elbunker.musica2@gmail.com`).
2. Entrar a Drive → crear carpeta `BUNKER_MUSICA` o `BUNKER_FOTOS`.
3. Compartir con `thebunker.admin@gmail.com` (permiso: Editor).
4. Copiar ID de carpeta (URL después de `/folders/`).
5. App logueado como Admin → sección bibliotecas → Añadir biblioteca.
6. Rellenar: email, tipo, etiqueta, ID carpeta, capacidad (14 GB para margen).

Al llegar al 90% crear una nueva del mismo tipo — coexisten.
