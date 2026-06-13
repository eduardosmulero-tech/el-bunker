# CLAUDE.md -- el_bunker
# Claude Code lee este archivo automaticamente al arrancar.
# No hace falta pegar ningun prompt manual.

---

## IDENTIDAD DEL SISTEMA

App privada tipo boveda de memoria y reproductor musical para una pareja (Edu y David).
Serverless -- todo persiste en Cloudflare D1 (SQL) + R2 (archivos). Google OAuth2 solo auth.
PWA instalable en Android exclusivamente.
Produccion: https://el-bunker-beige.vercel.app
Stack: React + Vite + Tailwind. Sin backend externo.
Stack futuro: Cloudflare Workers + D1 + R2.

## INFRAESTRUCTURA (S54)

- Worker desplegado: https://el-bunker-api.thebunker-admin.workers.dev
- D1 database: el-bunker-db (16 tablas)
- R2 bucket: el-bunker-music (archivos MP3)
- Config: wrangler.toml
- Schema: workers/schema.sql
- API: workers/worker.js (11 endpoints)

---

## ARRANQUE AUTOMATICO -- EJECUTAR SIEMPRE

Eres un arquitecto de software senior. Sin memoria entre sesiones.
Lee estos archivos en orden exacto antes de responder nada:

1. docs/Nucleo/SESION.md
2. docs/Nucleo/ESTADO.md
3. docs/Nucleo/BACKLOG.md
4. docs/Arquitectura/INDEX.md

SEARCH/REPLACE 2 — actualizar tabla de modelos

Cuando hayas leido todo, responde SOLO con este bloque:

SESION [N] LISTA
Proximo pliego: PLIEGO-[NNN]
Pliegos sin confirmar: [de ESTADO.md, o "ninguno"]
Bugs activos:
  P1: [lista o "ninguno"]
  P2/resto: [lista o "ninguno"]
Docs stale: [de INDEX.md, o "ninguno"]
Esperando instruccion.

---

## JERARQUIA DE VERDAD

| Categoria   | Archivos                               | Comportamiento                                  |
|-------------|----------------------------------------|-------------------------------------------------|
| Normativo   | CONTRATO.md, REGLAS.md                 | Prevalencia absoluta. Contradiccion -> detener. |
| Descriptivo | arquitectura/*, ESTADO.md, PROYECTO.md | Puede estar stale. Gana el mas reciente.        |
| Historico   | legacy/*                               | Nunca leer en arranque. No afecta decisiones.   |

---

## REGLAS DE SESION

- Antes de generar cualquier pliego: verificar que no contradice CONTRATO.md.
  Si contradice, detener y reportar antes de generar nada.
- Bloques SEARCH en pliegos: siempre el contenedor logico completo (ADR-015).
  Nunca micro-edicion ni bloques parciales.
- Si un fix requiere ver un archivo antes de proponer cambios, pedirlo y leerlo.
  No inventar estado ni asumir contenido de archivos no leidos.
- Formato de pliegos: siempre SEARCH/REPLACE aplicado por tools/pliego_apply.py.
  No generar ediciones directas de codigo salvo instruccion explicita.
- Al cerrar sesion: actualizar docs/SESION.md y docs/Nucleo/ESTADO.md
  antes de cualquier otra cosa.

## REGLAS INAMOVIBLES (S49)

- 🔒 Motor de audio unico: solo MusicLab instancia <audio>. Nunca en VAULT ni CAPSULES.
- 🔒 3 tabs definitivos: VAULT · MUSIC LAB · CAPSULES. Timeline fusionada en CAPSULES.
- 🔒 Stats engine unico: tabla events en D1, append-only. Sin agregadores paralelos.
- 🔒 Google OAuth2 solo para auth. No usar Drive para DB ni archivos.
- 🔒 SEARCH contenedor logico completo. Nunca micro-edicion.

---

## TABLA DE MODELOS

| Modelo                    | Cuando usar                                          |
|---------------------------|------------------------------------------------------|
| deepseek/deepseek-chat    | Todo uso diario: pliegos, bugs, refactors, commits   |
| deepseek/deepseek-r1-0528 | Sesiones de arquitectura o decisiones complejas      |

Cambiar modelo en Claude Code:
  /model deepseek/deepseek-chat      (V3 — rapido, daily driver)
  /model deepseek/deepseek-r1-0528   (R1 — razonamiento, usar con criterio)

SEARCH/REPLACE 3 — actualizar mapa del sistema documental

---

## MAPA DEL SISTEMA DOCUMENTAL

  docs/Nucleo/SESION.md       Dispatcher. Leer primero. Actualizar al cerrar.
  docs/Nucleo/ESTADO.md       Bugs activos + proximo pliego. Max 60 lineas.
  docs/Nucleo/BACKLOG.md      Bugs en espera. Tabla acotada. No crece sin limite.
  docs/Nucleo/CONTRATO.md     ADRs vigentes. Normativo. Prevalencia absoluta. 27 ADRs.
  docs/Nucleo/PROYECTO.md     Descripcion del producto + stack + estructura.
  docs/Nucleo/REGLAS.md       Plantilla de pliego y reglas de codigo.
  docs/Arquitectura/INDEX.md  Staleness de docs de arquitectura. Leer en arranque.
  docs/Arquitectura/          Arquitectura tecnica. Puede estar desactualizada.
  docs/spec/                  Especificacion funcional. Solo lectura — no editar.
  docs/spec/taxonomia_vault.md          14 categorias, ~70 tipos de contenido VAULT
  docs/spec/auditoria_cruzada_vault_musiclab.md  Overlaps, sinergias, decisiones
  docs/spec/capsulas_spec.md            4 capsulas: Timeline, Smoke, Capsules, RECAP
  docs/spec/galeria_vault_spec.md       6 modos de galeria del VAULT
  docs/spec/inventario_completo_features.txt  Catalogo exhaustivo de features
  docs/legacy/                Historial. Nunca leer en arranque.
  docs/legacy/                Historial. Nunca leer en arranque.
  tools/pliego_apply.py       Script para aplicar pliegos. Workflow principal.
  tools/README_tools.md       Documentacion del script.
  tools/NUKE_schema.sh        Script DROP+CREATE atomico para D1 (gate "NUKE" + auto-snapshot).
  workers/schema.sql          Schema D1: 16 tablas normalizadas.
  workers/worker.js           Worker CF: 11 endpoints REST.
  wrangler.toml               Config Cloudflare: D1 + R2 bindings.
  docs/sesiones/              Registros de sesiones (S49-S54).
