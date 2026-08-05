// tools/audit-ui/playwright/detectors/console-error-detector.js
// (c) Errores de consola JS. Colector basado en eventos: attach() ANTES de la
//     navegación (los errores en el arranque de la página se pierden si se
//     intercepta el console después). Dedupe por id en measure-page.
import { stableId, elementoLabel } from './stable-id.js';

const TIPO = 'error_consola';

export class ConsoleErrorDetector {
  attach(page) {
    this._errores = [];
    this._handler = (msg) => {
      if (msg.type() === 'error') this._errores.push(msg.text());
    };
    page.on('console', this._handler);
  }

  detach(page) {
    if (this._handler) page.off('console', this._handler);
  }

  /**
   * @param {import('playwright').Page} _page
   * @param {{ vista: string }} ctx
   * @returns {Promise<Array>} hallazgos
   */
  async detect(_page, { vista }) {
    return this._errores.map((mensaje) => {
      const nombre = mensaje.slice(0, 120);
      const id = stableId({ vista, rol: 'consola', nombre, tipo: TIPO });
      return {
        id,
        vista,
        elemento: elementoLabel({ rol: 'consola', nombre }),
        tipo: TIPO,
        medida: { mensaje },
      };
    });
  }
}
