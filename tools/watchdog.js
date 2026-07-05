/**
 * WATCHDOG — Automatización Sonnet ↔ DeepSeek
 * ==============================================
 * Vigila task_deepseek.md por cambios y dispara al agente que corresponda.
 *
 * Protocolo:
 *   .task_state  →  "deepseek" | "sonnet"
 *   Cuando task_deepseek.md cambia, el watchdog invoca al CLI
 *   correspondiente al turno actual. Cada agente, al terminar,
 *   debe actualizar .task_state con el turno del otro.
 *
 * Uso:
 *   node tools/watchdog.js
 *
 * Requiere Node.js (ya presente en el proyecto).
 * Compatible Windows/Linux/Mac — usa polling (sin inotify nativo).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN — Ajusta estos comandos según tu CLI
// ═══════════════════════════════════════════════════════════

const ROOT = path.join(__dirname, '..');
const TASK_FILE = path.join(ROOT, 'task_deepseek.md');
const STATE_FILE = path.join(ROOT, '.task_state');
const POLL_MS = 2000;

// Comandos para invocar cada agente.
// El watchdog ejecuta el comando en la raíz del proyecto.
const AGENT_COMMANDS = {
  deepseek: 'codebuff "task_deepseek.md actualizado — turno DEEPSEEK. Ponte en contexto, lee el archivo, ejecuta la tarea, y al terminar actualiza .task_state a sonnet."',
  sonnet:   'codebuff "task_deepseek.md actualizado — turno SONNET. Revisa el resultado contra el codigo real. Si OK, escribe la siguiente tarea y actualiza .task_state a deepseek."',
};

// ═══════════════════════════════════════════════════════════

function readTurn() {
  try {
    const t = fs.readFileSync(STATE_FILE, 'utf8').trim();
    return t || null;
  } catch {
    return null;
  }
}

function writeTurn(turn) {
  fs.writeFileSync(STATE_FILE, turn);
}

function fileHash(filePath) {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return null;
  }
}

function timestamp() {
  return new Date().toLocaleTimeString('es-ES', { hour12: false });
}

function log(msg) {
  console.log('[' + timestamp() + '] ' + msg);
}

// ─── MAIN ──────────────────────────────────────────────────
let lastHash = fileHash(TASK_FILE);
let turn = readTurn();
let running = false;

if (!turn) {
  turn = 'deepseek';
  writeTurn(turn);
  log('WARN .task_state no existia — inicializado: ' + turn);
}

log('WATCHDOG ARRANCADO');
log('   Turno actual : ' + turn.toUpperCase());
log('   Vigilando    : ' + path.basename(TASK_FILE));
log('   Sondeo       : cada ' + (POLL_MS / 1000) + 's');
log('   Ctrl+C para detener');
log('──────────────────────────────────────────────');

setInterval(() => {
  if (running) return;

  const currentHash = fileHash(TASK_FILE);
  if (!currentHash || currentHash === lastHash) return;

  lastHash = currentHash;
  const currentTurn = readTurn();

  if (!currentTurn) {
    log('WARN .task_state vacio — ignorando cambio');
    return;
  }

  log('CAMBIO DETECTADO — Turno: ' + currentTurn.toUpperCase());

  const cmd = AGENT_COMMANDS[currentTurn];
  if (!cmd) {
    log('ERROR No hay comando definido para turno: ' + currentTurn);
    return;
  }

  running = true;
  log('Ejecutando agente ' + currentTurn.toUpperCase() + '...');

  exec(cmd, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024, timeout: 300000 }, (err, stdout, stderr) => {
    running = false;
    if (err) {
      log('ERROR ' + currentTurn.toUpperCase() + ' termino con error (codigo ' + (err.code || '?') + ')');
      if (stderr) console.error(stderr.trim().split('\n').slice(-5).join('\n'));
    } else {
      log('OK ' + currentTurn.toUpperCase() + ' completado');
    }
    lastHash = fileHash(TASK_FILE);
    const nextTurn = readTurn();
    log('   Siguiente turno : ' + (nextTurn || '???').toUpperCase());
    log('──────────────────────────────────────────────');
  });
}, POLL_MS);
