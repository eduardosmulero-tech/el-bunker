# CLAUDE.md -- el_bunker
# Claude Code lee este archivo automaticamente al arrancar.
# No hace falta pegar ningun prompt manual.

---

## IDENTIDAD DEL SISTEMA

App privada tipo boveda de memoria para una pareja (Edu y David).
Serverless -- todo persiste en Google Drive API v3 + Cloudflare R2.
PWA instalable en Android exclusivamente.
Produccion: https://el-bunker-beige.vercel.app
Stack: React + Vite + Tailwind. Sin backend externo.
Backend IA: DeepSeek V3 via OpenRouter.

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
  docs/Nucleo/CONTRATO.md     ADRs vigentes. Normativo. Prevalencia absoluta.
  docs/Nucleo/PROYECTO.md     Descripcion del producto.
  docs/Nucleo/REGLAS.md       Plantilla de pliego y reglas de codigo.
  docs/Arquitectura/INDEX.md  Staleness de docs de arquitectura. Leer en arranque.
  docs/Arquitectura/          Arquitectura tecnica. Puede estar desactualizada.
  docs/spec/                  Especificacion funcional. Solo lectura — no editar.
  docs/legacy/                Historial. Nunca leer en arranque.
  tools/pliego_apply.py       Script para aplicar pliegos. Workflow principal.
  tools/README_tools.md       Documentacion del script.
