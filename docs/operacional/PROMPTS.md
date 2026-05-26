# PROMPTS.md — el_bunker
> Prompts operativos para arranque y cierre de sesión.
> Claude no lee este archivo en arranque — es para uso humano (Edu).

---

## PROMPT ARRANQUE

Pega esto al inicio de cada sesión nueva junto con `docs/SESION.md` adjunto.
Eres un arquitecto de software senior trabajando en el proyecto el_bunker.
PASO 1 — ANTES DE RESPONDER NADA: Lee los siguientes documentos completos en este orden:

docs/SESION.md
docs/Nucleo/CONTRATO.md
docs/Nucleo/PROYECTO.md
docs/Nucleo/REGLAS.md
docs/Nucleo/ESTADO.md
docs/Arquitectura/INDEX.md

No resumas de memoria ni del chat anterior. Lee los archivos adjuntos.
PASO 2 — ARRANQUE: Cuando hayas leído todo, responde SOLO con este bloque:

SESIÓN [N] LISTA
Próximo pliego: PLIEGO-[NNN]
Pliegos sin confirmar: [lista de SESION.md]
Bugs pendientes (por prioridad):
P1: [bugs P1 de Nucleo/ESTADO.md]
P2: [bugs P2]
P3: [bugs P3]
P4/Feature Gaps: [bugs P4]
Docs stale: [de Arquitectura/INDEX.md]
Esperando instrucción.

---

## PROMPT CIERRE DE SESIÓN

Pega esto al cerrar sesión o cuando Claude avise de límite de contexto.
Cierre de sesión. Ejecuta el checklist completo en orden:

Actualizar docs/SESION.md:

sesion_numero → siguiente
fecha_ultima_actualizacion → hoy
pliego_siguiente → próximo número
pendiente_de_cierre_anterior → false
pliegos sin confirmar → actualizar lista


Actualizar docs/Nucleo/ESTADO.md:

Marcar bugs resueltos esta sesión (eliminar fila)
Añadir bugs nuevos detectados con ID y Pliego asignado
Actualizar deuda técnica si hay cambios


Actualizar docs/Arquitectura/INDEX.md:

Marcar stale los docs cuyos archivos fueron tocados esta sesión
Actualizar sincronizado_con si se resincronizó algún doc


Actualizar docs/Nucleo/CONTRATO.md:

Añadir o modificar ADR si se tomó decisión arquitectónica esta sesión


Mover bugs resueltos a docs/legacy/ERRORES_RESUELTOS.md
Añadir entrada a docs/legacy/SESIONES.md:

Número de sesión, fecha, pliegos aplicados, commits


Mover pliegos aplicados de PLIEGOS.md a docs/legacy/PLIEGOS_HISTORIAL.md
Verificar que ningún archivo de docs/Nucleo/ supera su límite de líneas:

CONTRATO.md → 150 líneas
PROYECTO.md → 60 líneas
REGLAS.md → 80 líneas
ESTADO.md → 100 líneas



Genera solo los archivos que hayan cambiado. Si un doc no cambió, indícalo explícitamente.

---

## CHECKLIST CIERRE DE PLIEGO
*(ejecutar en el mismo commit del pliego, no negociable)*

- [ ] Marcar stale en `docs/Arquitectura/INDEX.md` los docs que describen archivos tocados
- [ ] Actualizar `docs/Nucleo/CONTRATO.md` si el pliego implementa o modifica un ADR
- [ ] Actualizar `docs/Nucleo/ESTADO.md` con bugs nuevos o resueltos
- [ ] Actualizar número siguiente en `PLIEGOS.md`