// tools/audit-ui/playwright/detectors/stable-id.js
// Identidad estable del hallazgo (veredicto §3):
//   id = sha1( vista | rol + nombre accesible del elemento | tipo de defecto )
// Los píxeles NUNCA entran en el id — van en `medida` (payload).
import { createHash } from 'node:crypto';

const ID_LENGTH = 12;

/**
 * Construye el id estable de un hallazgo.
 * @param {{ vista: string, rol: string, nombre: string, tipo: string }} partes
 * @returns {string} sha1 hex truncado a 12 caracteres
 */
export function stableId({ vista, rol, nombre, tipo }) {
  const elemento = `${rol} «${nombre}»`;
  const seed = `${vista}|${elemento}|${tipo}`;
  return createHash('sha1').update(seed, 'utf8').digest('hex').slice(0, ID_LENGTH);
}

/**
 * Rol y nombre accesible de un elemento, vía la API de accesibilidad de
 * Chromium (getComputedRole / getComputedLabel). Se ejecuta DENTRO de la
 * página: la función debe ser autocontenida (no importa nada del módulo).
 * @param {Element} el
 * @returns {{ rol: string, nombre: string }}
 */
export function inPageIdentity(el) {
  const hasRoleFn = typeof window.getComputedRole === 'function';
  const hasLabelFn = typeof window.getComputedLabel === 'function';
  const rawRole = hasRoleFn ? window.getComputedRole(el) : '';
  const rawLabel = hasLabelFn ? window.getComputedLabel(el) : '';
  const rol = (typeof rawRole === 'string' && rawRole.trim())
    || el.getAttribute?.('role')
    || el.tagName.toLowerCase();
  const nombre = (typeof rawLabel === 'string' && rawLabel.trim())
    || el.getAttribute?.('aria-label')
    || el.getAttribute?.('title')
    || (el.textContent || '').replace(/\s+/g, ' ').trim();
  return {
    rol: String(rol).trim() || el.tagName.toLowerCase(),
    nombre: String(nombre).trim().slice(0, 120),
  };
}

/**
 * Formatea la cadena `elemento` del anexo: `rol «nombre»`.
 * @param {{ rol: string, nombre: string }} identidad
 * @returns {string}
 */
export function elementoLabel({ rol, nombre }) {
  return `${rol} «${nombre}»`;
}
