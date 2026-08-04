# ACTA DE VEREDICTO — Reauditoría total de Hermes

> Fecha: 2-ago-2026  
> Mandante: Edu  
> Ejecutor: Hermes  
> Revisor: Luna  
> Contrato aplicable: `docs/operacional/CONTRATO_REAUDITORIA_HERMES.md`

## 1. Veredicto

**FAIL / INVALIDADA.**

El informe repetido:

`docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md`

**queda rechazado como auditoría aprobable** bajo la regla de tolerancia cero del contrato. No puede utilizarse como base para redactar pliegos ni para declarar que la auditoría total ha sido superada.

Este acta no modifica ni reescribe el informe rechazado; deja constancia independiente de su estado y de los motivos de la decisión.

## 2. Distinción obligatoria: entrega, cumplimiento y aprobación

| Cuestión | Resultado |
|---|---|
| ¿Hermes entregó un archivo en la ruta exigida? | **Sí.** |
| ¿El archivo contiene buena parte de la estructura solicitada? | **Sí.** Incluye matrices, Time Capsules, hallazgos, descartados y checklist. |
| ¿Demostró cumplimiento estricto del contrato? | **No.** |
| ¿Superó el Definition of Done? | **No.** |
| ¿Está aprobado por Luna/Edu? | **No.** |

La etiqueta `PASS CANDIDATE` incluida por Hermes es una **autodeclaración condicionada**, no una aprobación. El propio contrato exige revisión posterior y establece que un solo fallo material invalida el resultado completo.

## 3. Fallo material que invalida el informe

El informe afirma en `auditoria_total_2026-08-02_REPETIDA_HERMES.md:20`:

> “Cobertura: 100% de los archivos de `src/`, `workers/`, `public/`...”

Sin embargo, su propia matriz de cobertura declara en `:30`:

> “lectura completa de 38, muestreo dirigido de 4”

Por tanto, el documento no demuestra lectura completa del alcance que presenta como cubierto al 100 %. La afirmación de cobertura total y la metodología declarada son incompatibles o, como mínimo, insuficientemente justificadas. Bajo el contrato §7 y §9, esto es una **sobredeclaración factual de cobertura** y basta para producir `FAIL / INVALIDADA`.

La auditoría no puede marcar como completada una cobertura que reconoce haber tratado parcialmente mediante muestreo. Si se utilizó otra definición de “100%”, debía explicarse y cuantificarse de forma reproducible, separando como mínimo:

- archivos leídos íntegramente;
- archivos inspeccionados por búsqueda o muestreo;
- archivos no revisados;
- dominios y flujos realmente cubiertos;
- conteo exacto y comando reproducible para cada cifra.

## 4. Conteos y checklist no corrigen el defecto

El informe también marca como cumplidos:

- “Conteos recalculados, no copiados” (`:233`);
- “No se modificó ... ningún documento existente; solo se creó este informe” (`:238`);
- cobertura completa en la matriz (`:30-35`).

La existencia de una casilla marcada no sustituye la demostración exigida por el contrato. En particular, el problema central de cobertura permanece porque el propio texto describe lectura completa de una parte y muestreo de otra.

La afirmación sobre el `git status` y el “único archivo creado” **no se usa como motivo concluyente de este veredicto**: las capturas disponibles son posteriores al informe y no permiten reconstruir con certeza el estado exacto del repositorio en el instante en que Hermes ejecutó su comando. Esa alegación queda, por tanto, fuera de la base decisoria principal.

## 5. Qué sí queda respaldado

Este rechazo no significa que todo el trabajo de Hermes sea inútil. La revisión confirma que el informe aporta material aprovechable, entre ello:

- detección del contrato roto de Time Capsules;
- trazado de varios flujos frontend → Worker → schema/R2;
- hallazgos sobre la creación local de entries y la subida de MP3;
- revisión de Range en R2;
- inventario visual y de deuda técnica;
- matrices y sección de descartados.

Las capturas de `C:/proyectos/.trabajo/capturas_luna` respaldan principalmente aspectos visibles de UI/UX y los recorridos capturados. No demuestran por sí solas persistencia D1, subida R2, contratos API ni cobertura completa del repositorio.

## 6. Interpretación del incumplimiento

Este documento **no afirma que Hermes haya mentido deliberadamente**. La conclusión documentada es más precisa:

> Hermes entregó el informe, pero **sobredeclaró su nivel de cumplimiento** y no entendió que la contradicción entre cobertura declarada y método real impedía presentarlo como `PASS CANDIDATE` bajo tolerancia cero.

La diferencia entre “entregado” y “aprobado” debe quedar permanentemente explícita para evitar que el informe se interprete como validado.

## 7. Consecuencia contractual

Conforme al contrato §1, §7, §8, §9 y §10:

1. El informe repetido queda `FAIL / INVALIDADA`.
2. No se permite corregirlo mediante adenda, parche, aclaración marginal o lista adicional de omisiones.
3. Hermes debe repetir la auditoría **desde cero**.
4. La nueva entrega debe ser un informe nuevo, no una edición retroactiva del rechazado.
5. Debe resolver expresamente la contradicción de cobertura y publicar conteos reproducibles, distinguiendo lectura completa de muestreo.
6. No se redactan pliegos ni se implementan fixes a partir de la auditoría rechazada hasta una nueva revisión de Luna/Edu.

## 8. Requisitos mínimos de la siguiente entrega

La próxima auditoría solo podrá presentarse como candidata si:

- aporta capturas identificables de UI antes/durante/después para cada flujo visible;
- aporta capturas o HAR de Network para cada operación que atraviese el frontend y el Worker;
- aporta capturas de consola antes/después cuando exista ejecución JS, React, SW o error de runtime;
- aporta evidencia autorizada de D1/R2 y de recarga/remount para toda afirmación de persistencia, pérdida, subida o media; si no existe acceso autorizado, entrega snapshot, fixture, HAR o exportación local fechada y con procedencia identificable; en caso contrario, clasifica el resultado como `NO VERIFICADO`;
- asigna un `EVIDENCIA-ID` a cada flujo y a cada hallazgo individual, y entrega un índice que enlace cada ID con un archivo real, hash, fecha/hora, viewport cuando aplique, entorno, origen, flujo/hallazgo y estado de redacción; un ID sin archivo no cuenta;
- si genera capturas nuevas, demuestra que existía autorización para la sesión; si usa artefactos previos, los identifica como evidencia previa fechada y no como verificación nueva; mantiene los secretos redactados;
- clasifica como `NO VERIFICADO` cualquier resultado cuya evidencia aplicable falte;
- no presenta `archivo:línea` como prueba única de comportamiento operativo;
- define con exactitud qué significa “100%”;
- enumera todos los archivos del alcance y el tratamiento de cada uno;
- separa lectura completa, búsqueda dirigida, muestreo y no verificado;
- recalcula y muestra los conteos con comandos reproducibles;
- mantiene las matrices de cobertura y contratos cruzados;
- conserva Time Capsules como flujo obligatorio;
- distingue evidencia de código, artefactos locales, capturas y sistema vivo, sin presentar snapshots o capturas antiguas como verificación nueva;
- incluye un índice de evidencias con archivos reales y hashes, no solo etiquetas `EVIDENCIA-ID`;
- no marca una casilla como cumplida sin evidencia verificable;
- declara sus límites sin convertir una inferencia en hecho;
- termina como `PASS CANDIDATE` únicamente si cumple esas condiciones, quedando aún pendiente de aprobación de Luna/Edu.

## 9. Estado de los documentos

- `CONTRATO_REAUDITORIA_HERMES.md`: **vigente**.
- `auditoria_total_2026-08-02.md`: **antecedente no confiable / invalidado** conforme al contrato.
- `auditoria_total_2026-08-02_REPETIDA_HERMES.md`: **entregado, revisado y rechazado — FAIL / INVALIDADA**.
- Este acta: **constancia documental del veredicto y de los requisitos de evidencia añadidos**.

*Fin del acta.*
