# CLAUDE.md — el_bunker
> Meta-documento. Le dice a Claude cómo usar el sistema, no qué contiene.
> Leer solo en el arranque inicial de una sesión nueva.

---

## IDENTIDAD DEL SISTEMA

App privada tipo bóveda de memoria para una pareja (Edu y David).
Serverless — todo persiste en Google Drive API v3.
PWA instalable en Android exclusivamente.
**Producción:** https://el-bunker-beige.vercel.app

---

## SECUENCIA DE ARRANQUE OBLIGATORIA

Leer en este orden exacto antes de generar cualquier pliego:

1. `docs/SESION.md`
2. `docs/Nucleo/CONTRATO.md`
3. `docs/Nucleo/PROYECTO.md`
4. `docs/Nucleo/REGLAS.md`
5. `docs/Nucleo/ESTADO.md`
6. `docs/Arquitectura/INDEX.md`

---

## JERARQUÍA DE VERDAD

| Categoría | Archivos | Comportamiento |
|---|---|---|
| Normativo | CONTRATO.md, REGLAS.md | Prevalencia absoluta. Contradicción → Claude detiene y reporta. |
| Descriptivo | arquitectura/*, ESTADO.md, PROYECTO.md | Puede estar stale. Gana el más reciente. |
| Histórico | legacy/* | Nunca leer en arranque. No afecta decisiones. |

---

## TABLA DE MODELOS

| Modelo | Cuándo |
|---|---|
| qwen3-8b-nothink | < 20 líneas, CSS, textos, renombrados |
| qwen3-8b-think | < 20 líneas con lógica, props simples |
| qwen3-14b-nothink | > 100 líneas, lógica de estado, integraciones |
| qwen3-14b-think | auth, Drive API, Service Worker, bugs complejos, datos persistidos |

---

## MAPA DEL SISTEMA DOCUMENTAL