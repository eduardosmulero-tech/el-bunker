# DUPLICADOS EN D1 — 34 grupos por título+artista, 127 filas totales
# Criterio: mismas canciones subidas 2+ veces (mismo título + artista).
# Marcador KEEP = copia propuesta a conservar (más referencias; desempate: la más reciente con duración).
#
# ════════ RESULTADO EJECUTADO (1-ago-2026, OK Edu) ════════
# Estado final verificado por consulta D1:
#   - Tracks ACTIVOS (is_deleted=0): 529  |  Soft-deleted: 588  |  Total: 1.117
#   - Grupos duplicados exactos ACTIVOS (title+artist+duration): 0
#   - playlist_tracks apuntando a tracks soft-deleted: 0
#   - KEEP activos: 30/34 (los 4 inactivos eran grupos donde AMBAS copias ya estaban
#     soft-deleted antes de esta sesión — migración 9-jun purgada previamente)
#   - Tracks activos con drive_file_id (legacy Drive): 0
#
# Notas de ejecución (lecciones para el pliego):
#   1. La consulta inicial NO filtró is_deleted=0 → incluía tracks ya borrados.
#      De los 93 BORRAR propuestos, 63 ya estaban soft-deleted (purga previa);
#      solo 30 estaban activos y fueron los realmente borrados en esta sesión.
#   2. HALLAZGO SCHEMA (RESUELTO en esta sesión): D1 remota NO tenía columnas
#      `deleted_at`/`deleted_by` (solo is_deleted, updated_at) — el DELETE de
#      workers/routes/tracks.js:122 fallaba con SQLITE_ERROR "no such column".
#      MIGRADO: ALTER TABLE tracks ADD COLUMN deleted_at TEXT / deleted_by TEXT
#      (verificado: PRAGMA 20 cols + simulación del UPDATE del worker sin error).
#      Barrido schema.sql vs D1 remota: 17/17 tablas coinciden tras la migración.
#   3. Las 30 playlist_tracks que apuntaban a duplicados se eliminaron (KEEP ya
#      estaba en las playlists → DEL, sin re-apuntado). 4 playlists con tracks, 513 refs.
#   4. Backup reversible: docs/operacional/backup_duplicados_2026-08-01.json (93 filas
#      completas + 30 playlist_tracks) — restaurar = UPDATE is_deleted=0 + reinsertar.
# ════════════════════════════════════════════════════════════

### bad gyal - nueva york  (slowed + reverb) — Love Went Cold  (4 copias)
  [BORRAR] b3e7e073  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] dff32288  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] d448519f  dur=185  pl=1  ev=1  plays=0  2026-06-14T18:58
  [KEEP] 5666d509  dur=185  pl=1  ev=1  plays=0  2026-06-14T18:59

### bad gyal - su payita (gramos) (slowed + reverb) — Love Went Cold  (2 copias)
  [BORRAR] 73623036  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [KEEP] 70bb1fed  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33

### daddy yankee - la nueva y la ex (𝒔𝒍𝒐𝒘𝒆𝒅 + 𝒓𝒆𝒗𝒆𝒓𝒃) — droid  (4 copias)
  [BORRAR] b69617f2  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] bb5ce7da  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 7743a5f4  dur=232  pl=1  ev=1  plays=0  2026-06-14T18:57
  [KEEP] 7271f0fc  dur=232  pl=1  ev=1  plays=0  2026-06-14T19:01

### Daddy Yankee - Ven Conmigo (feat. Prince Royce) [Slowed + Reverb] — SynthZur  (4 copias)
  [BORRAR] 1898e11e  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] a063abc7  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 57789ebf  dur=263  pl=1  ev=2  plays=0  2026-06-14T18:57
  [KEEP] 5d7cf7dd  dur=263  pl=1  ev=4  plays=0  2026-06-14T18:58

### Delta Heavy - Get By  (s l o w e d) — Good ones  (4 copias)
  [BORRAR] 3cfbd875  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 81f2c9ff  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] 64e2fd9e  dur=233  pl=1  ev=7  plays=0  2026-06-14T18:59
  [BORRAR] e6b58a3c  dur=233  pl=1  ev=1  plays=0  2026-06-14T19:02

### don omar - danza kuduro (slowed + bass) — liljared  (2 copias)
  [BORRAR] 0d2969c7  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [KEEP] b9c4cfd3  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33

### don omar - dile (slowed) — liljared  (4 copias)
  [BORRAR] 90f0bb01  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 5439d6d9  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] 077e412d  dur=240  pl=1  ev=4  plays=0  2026-06-14T18:57
  [KEEP] 70b44b17  dur=240  pl=1  ev=7  plays=0  2026-06-14T19:00

### don omar - salió el sol (slowed + reverb) — liljared  (4 copias)
  [BORRAR] fd2462ac  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 1a7dacdc  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] dea337ef  dur=344  pl=1  ev=1  plays=0  2026-06-14T18:57
  [KEEP] 72938224  dur=344  pl=1  ev=7  plays=0  2026-06-14T18:58

### Don Omar - Virtual Diva (Slowed/Reverb) — travelpassenger  (4 copias)
  [BORRAR] f837af3b  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 427edfff  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] d81d6007  dur=281  pl=1  ev=8  plays=0  2026-06-14T18:57
  [BORRAR] 604d8174  dur=281  pl=1  ev=4  plays=0  2026-06-14T19:00

### Duck Sauce :: NRG (Skrillex, Kill The Noise, Milo & Otis Remix) [slowed + reverbed] — andy  (4 copias)
  [BORRAR] 43cfcf22  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 08b7a1f5  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] 922d1b1a  dur=297  pl=1  ev=1  plays=0  2026-06-14T19:00
  [KEEP] d70b03ed  dur=297  pl=1  ev=4  plays=0  2026-06-14T19:02

### Ella no sigue modas [slowed + Reverb] - [Don Omar ft. Juan Magan] — •stella-chan•  (4 copias)
  [BORRAR] 3dac0162  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 193cdf42  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] 92a64b74  dur=193  pl=1  ev=4  plays=0  2026-06-14T18:57
  [KEEP] 2aadd220  dur=193  pl=1  ev=4  plays=0  2026-06-14T18:59

### ella, ella - don omar/zion [slowed x reverb] — reggaeton viejo [slowed x reverb]  (4 copias)
  [BORRAR] 66591f8f  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 279ff9ba  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] e53f7e39  dur=248  pl=1  ev=4  plays=0  2026-06-14T18:57
  [KEEP] aaffd3bf  dur=248  pl=1  ev=4  plays=0  2026-06-14T19:00

### estrellita de madrugada - daddy yankee, omega (slowed) — livor  (4 copias)
  [BORRAR] 19a711d1  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 7a338a05  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [KEEP] 20854247  dur=252  pl=1  ev=4  plays=0  2026-06-14T18:57
  [BORRAR] abbb0377  dur=252  pl=1  ev=1  plays=0  2026-06-14T19:02

### extremoduro - la vereda de la puerta de atrás (slowed  + reverb) — ana huertas  (4 copias)
  [BORRAR] 8a686789  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] d66ded96  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] f9d3a2aa  dur=280  pl=1  ev=4  plays=0  2026-06-14T18:59
  [BORRAR] 0da2f644  dur=280  pl=1  ev=1  plays=0  2026-06-14T19:02

### Hold Your Colour - Pendulum (Slow) — SlowItDownTay  (4 copias)
  [BORRAR] bdba0279  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 698ce48d  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] 101d6437  dur=452  pl=1  ev=1  plays=0  2026-06-14T18:57
  [KEEP] f1229829  dur=452  pl=1  ev=3  plays=0  2026-06-14T19:02

### la despedida - daddy yankee (slowed) — livor  (4 copias)
  [BORRAR] be59c7be  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] d7b78edb  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] 1f3d7fdc  dur=247  pl=1  ev=3  plays=0  2026-06-14T18:58
  [KEEP] ee0f3985  dur=247  pl=1  ev=4  plays=0  2026-06-14T18:58

### Llamado de emergencia ( slowed ) — Yadira  (4 copias)
  [BORRAR] 6e931a78  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 1b3de7d4  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [KEEP] 7f8c052e  dur=263  pl=1  ev=4  plays=0  2026-06-14T19:01
  [BORRAR] 3f29645f  dur=263  pl=1  ev=1  plays=0  2026-06-14T19:01

### major lazer & dj snake - lean on (slowed + reverb) — cue  (4 copias)
  [BORRAR] 18875069  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] ce031f3b  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] dd42e9b9  dur=195  pl=1  ev=4  plays=0  2026-06-14T19:01
  [BORRAR] 963dffe1  dur=195  pl=1  ev=1  plays=0  2026-06-14T19:02

### Mi Vecinita - Plan B ( slowed + 𝒓𝒆𝒗𝒆𝒓𝒃 ) — Slow 死  (4 copias)
  [BORRAR] 303bedf8  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] e605ebc6  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] cfe27895  dur=215  pl=1  ev=1  plays=0  2026-06-14T19:00
  [KEEP] 40c8f3ba  dur=215  pl=1  ev=1  plays=0  2026-06-14T19:00

### michael jackson - beat it - slower with heavy reverb — Roachaximus  (4 copias)
  [BORRAR] ebbab04a  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 5f00b78b  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] 487d8057  dur=447  pl=1  ev=1  plays=0  2026-06-14T19:00
  [KEEP] c64b95ad  dur=447  pl=1  ev=4  plays=0  2026-06-14T19:02

### Moment- lil death (Slowed and Reverb) — Unfortunately  (4 copias)
  [BORRAR] 58c8568f  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] eff62f4f  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] ca99d400  dur=164  pl=1  ev=1  plays=0  2026-06-14T19:01
  [KEEP] 3ee71a1a  dur=164  pl=1  ev=1  plays=0  2026-06-14T19:02

### Perros Salvajes - Daddy Yankee (Slowed + Reverd) — LukasMatias17  (4 copias)
  [BORRAR] 0bb67538  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 184a7b2e  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] f619acb5  dur=222  pl=1  ev=7  plays=0  2026-06-14T18:56
  [BORRAR] 663ce416  dur=222  pl=1  ev=4  plays=0  2026-06-14T19:00

### plan b — es un secreto (slowed) — mami  (5 copias)
  [BORRAR] 7011b715  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 36187646  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] f8d71a2f  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] ce594ed1  dur=229  pl=1  ev=8  plays=0  2026-06-14T19:00
  [BORRAR] d573ddd5  dur=229  pl=1  ev=4  plays=0  2026-06-14T19:02

### Pose//Daddy Yankee//Slowed+Reverb (Remastered) — juicycyber ♱  (4 copias)
  [BORRAR] 18a66227  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] a803b818  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] 81e5a96d  dur=306  pl=1  ev=4  plays=0  2026-06-14T18:58
  [BORRAR] 616b9e75  dur=306  pl=1  ev=3  plays=0  2026-06-14T18:58

### Rihanna - Pon De Replay (slowed + reverb) — ty wazowski  (4 copias)
  [BORRAR] 897b2554  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 466996f5  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] 6c39aa34  dur=291  pl=1  ev=1  plays=0  2026-06-14T19:01
  [KEEP] c22f100c  dur=291  pl=1  ev=4  plays=0  2026-06-14T19:02

### Rompe - Daddy Yankee (Slowed + Reverb) — Hanako Kuns Toilet  (4 copias)
  [BORRAR] 8213547b  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 2cb7d462  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] 6ae123f4  dur=241  pl=1  ev=5  plays=0  2026-06-14T18:57
  [BORRAR] 1c4e4632  dur=241  pl=1  ev=1  plays=0  2026-06-14T19:00

### Running in the 90's Vaporwave (vocal version) - sytricka — Horizon  (4 copias)
  [BORRAR] 0c348cfd  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 8d5cc4a1  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] 98b5304f  dur=310  pl=1  ev=9  plays=0  2026-06-14T19:02
  [BORRAR] 38266257  dur=310  pl=1  ev=6  plays=0  2026-06-14T19:02

### Selecta, Los Caños - Niña Piensa en Ti (Selecta Remix) [Videoclip] — Selecta  (2 copias)
  [BORRAR] 77f0c267  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [KEEP] 43fe108f  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32

### Suffocation — Crystal Castles  (2 copias)
  [BORRAR] 8bc41b15  dur=221  pl=1  ev=2  plays=0  2026-06-14T19:13
  [KEEP] 5d5b8209  dur=221  pl=1  ev=3  plays=0  2026-06-14T19:14

### The Prodigy - No Good (Start The Dance) (slowed + reverb) — SLOW RADIO 🔈  (4 copias)
  [BORRAR] 168cd467  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 1ff22e0f  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] 3be2d5a9  dur=456  pl=1  ev=1  plays=0  2026-06-14T18:59
  [KEEP] 28e5dd92  dur=456  pl=1  ev=1  plays=0  2026-06-14T19:02

### tu principe - daddy yankee, zion y lennox (slowed) — livor  (4 copias)
  [BORRAR] 8a679ccd  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] 5f41095c  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] fa76f643  dur=251  pl=1  ev=4  plays=0  2026-06-14T19:01
  [KEEP] 8781fca5  dur=251  pl=1  ev=4  plays=0  2026-06-14T19:02

### wisin y yandel ~ abusadora (slowed+reverb) — Down  (2 copias)
  [BORRAR] 5a98157c  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [KEEP] d0600a46  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33

### Zorra - Bad Gyal (slowed + reverb) — ty wazowski  (4 copias)
  [BORRAR] f0bf738d  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] b5af2966  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [BORRAR] a753aafc  dur=211  pl=1  ev=3  plays=0  2026-06-14T18:58
  [KEEP] 6d1ecd8a  dur=211  pl=1  ev=4  plays=0  2026-06-14T18:59

### Ｙｏｕｎｇ　Ｔｕｒｋｓ　(slowed down) — Frankintosh  (4 copias)
  [BORRAR] 83ec6244  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:32
  [BORRAR] f670a311  dur=-  pl=0  ev=2  plays=0  2026-06-09 04:33
  [KEEP] 00837b25  dur=376  pl=1  ev=7  plays=0  2026-06-14T18:58
  [BORRAR] df337d84  dur=376  pl=1  ev=1  plays=0  2026-06-14T19:02

TOTAL A BORRAR: 93