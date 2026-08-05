# CARRILES NATIVOS DE HERMES — estado de cierre (5-ago-2026)

> Opus, tarjeta `t_4fa4e1c6` (carril `opus`, board `el-bunker`).
> **Desviación de contrato, declarada de entrada:** la tarjeta decía *preparar, no ejecutar*, y
> P10/P11 del canon marcan que crear perfiles y elegir proveedor **son actos de Edu**. Edu dio la
> orden en vivo a mitad de sesión ("reparte trabajo a Hermes… exprime los modelos gratuitos") y
> **los perfiles se crearon**. Queda escrito porque el fallo de método fue mío: la contradicción
> entre la tarjeta y la orden había que resolverla con él **antes**, no después.
> Todo lo de aquí está verificado por ping real en esta sesión salvo lo marcado como pendiente.

---

## 1. La cuadrilla, tal como está ahora

| Perfil | Proveedor | Modelo | Coste | Ping | Papel |
|---|---|---|---|---|---|
| `flash1` | `opencode-zen` | `deepseek-v4-flash-free` | **gratis** | ⏳ falta clave en su `.env` (§2) | ejecutor principal |
| `flash2` | `opencode-zen` | `deepseek-v4-flash-free` | **gratis** | ⏳ ídem | ejecutor principal, 2º carril |
| `obrero1` | `openrouter` | `cohere/north-mini-code:free` | **gratis** | ✅ responde | ejecutor de código |
| `obrero2` | `openrouter` | `nvidia/nemotron-3-super-120b-a12b:free` | **gratis** | ✅ responde | ejecutor |
| `obrero3` | `openrouter` | `nvidia/nemotron-3-ultra-550b-a55b:free` | **gratis** | ✅ responde | revisor de entregas |

Ningún carril usa modelo de pago. `default` se queda como está (`opencode-go/deepseek-v4-flash`,
tu suscripción) y es el `orchestrator_profile` del kanban.

**Invariante que sigue intacto** (verificado): `kanban.default_assignee: ''`. Una tarjeta sin
assignee nunca se auto-asigna ni se spawnea.

## 2. Lo que falta, y solo lo puedes hacer tú

**a) La clave de zen en los dos perfiles `flash`.** Está en el `.env` raíz, pero un perfil no
hereda el `.env` raíz — por eso `flash1`/`flash2` responden `No usable credentials`. Un comando:

```powershell
$k = (Select-String -Path "$env:LOCALAPPDATA\hermes\.env" -Pattern 'OPENCODE_ZEN_API_KEY=(\S+)').Matches[0].Groups[1].Value
foreach ($p in @('flash1','flash2')) { Add-Content "$env:LOCALAPPDATA\hermes\profiles\$p\.env" "OPENCODE_ZEN_API_KEY=$k" }
```

Verificación: `hermes -p flash1 chat -q "di solo OK"` → responde.

**b) Arrancar el gateway.** Sin él, el board no despacha nada:

```powershell
hermes gateway install --start-now --start-on-login
```

Tick del dispatcher: 60 s. En cuanto arranque, `t_420b2f04` (AUD-1, asignada a `obrero1`) se pone
en marcha sola.

**c) Rotar la clave de zen.** Está en claro en `cerebro/inbox/20260723_213612_88ae8d-…md`,
**commiteada y subida a `origin/main`** (repo privado, verificado con `gh`). Privado baja el susto,
pero copiarla adelante es mantener viva una credencial que ya vive en el historial de GitHub.
Rotar en opencode.ai y pegar la nueva a mano es más barato que reescribir historia. Misma familia:
`config.yaml:240` tiene otra API key en claro — por eso los perfiles se crearon **sin `--clone`**,
que copia el `config.yaml` entero.

## 3. Trampas verificadas (por si mañana algo no arranca)

| Síntoma | Causa real |
|---|---|
| Perfil nuevo responde `HTTP 402` de openrouter con `z-ai/glm-5.2` | **Un perfil NO hereda el `config.yaml` raíz.** Cada uno necesita el suyo con `model.default` + `model.provider` |
| `deepseek-v4-flash-free` da `No usable credentials` | `opencode-zen` (alias `opencode`) **no es** `opencode-go`. Son dos proveedores con dos claves: `OPENCODE_ZEN_API_KEY` (gratis) y `OPENCODE_GO_API_KEY` (tu suscripción) |
| `kimi-k3-free` no resuelve desde un perfil | `custom_providers` solo está declarado en el `config.yaml` raíz; un perfil con config propio no lo ve |
| Los perfiles no salen en la app de escritorio | El desktop los enumera al arrancar. Llevaba desde el 4-ago 16:53 abierto; se reinicia y salen |
| El wrapper `obrero1.bat` falla con *"hermes no se reconoce"* | El `.bat` llama a `hermes` por PATH. Desde una shell sin ese PATH, usar `hermes -p obrero1 …` |

## 4. Qué tarjetas pasan a carril nativo

Hoy todos los carriles eran de terminal (P11). Con los 5 perfiles en disco, **lo mecánico con DoD
escrito como test** puede ir a nativo sin reescribir la tarjeta: solo cambia el `assignee`.

- **Ya asignada:** `t_420b2f04` — AUD-1, arnés de auditoría UI, carril `obrero1`, con ámbito
  cerrado (`tools/audit-ui/**`) y DoD verificable (la página trampa da 3 hallazgos y solo 3).
- **Candidatas naturales cuando cierren sus dependencias:** AUD-3 (cobertura), FIX-SB, y la
  ejecución de diseños ya escritos con su suite en rojo.
- **NO van a carril nativo:** nada irreversible (P8 — migraciones, deploys, borrados), nada que
  toque el punto de enchufe de una ola (P12) y nada que exija criterio de producto.

**El reparto no lo hago yo.** Coordinar es del carril de Sonnet; estos perfiles son
infraestructura, no una cola. Lo que dejo listo es la infraestructura y una tarjeta de ejemplo con
el contrato bien escrito.

## 5. Requisito de calidad para cualquier tarjeta que vaya a estos carriles

Un modelo gratis recolecta bien y concluye mal. La regla que ya demostró funcionar en la Ola 1 vale
doble aquí: **si el DoD se puede escribir como test, se escribe como test y se entrega en rojo**, y
**la entrega se verifica por artefacto** (`vitest`, `eslint`, `git diff --name-only`), nunca por el
informe del worker.
