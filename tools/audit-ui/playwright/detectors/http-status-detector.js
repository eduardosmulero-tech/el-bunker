// tools/audit-ui/playwright/detectors/http-status-detector.js
// (d) Respuestas HTTP con status >= 400 + número de peticiones por pantalla.
//     Colector de eventos attach() ANTES de la navegación.
import { stableId, elementoLabel } from './stable-id.js';

const TIPO = 'http_error';

export class HttpStatusDetector {
  attach(page) {
    this._peticiones = 0;
    this._fallos = [];
    this._onRequest = () => { this._peticiones += 1; };
    this._onResponse = (res) => {
      if (res.status() >= 400) {
        this._fallos.push({
          url: res.url(),
          status: res.status(),
          metodo: res.request().method(),
        });
      }
    };
    page.on('request', this._onRequest);
    page.on('response', this._onResponse);
  }

  detach(page) {
    if (this._onRequest) page.off('request', this._onRequest);
    if (this._onResponse) page.off('response', this._onResponse);
  }

  /**
   * @param {import('playwright').Page} _page
   * @param {{ vista: string }} ctx
   * @returns {Promise<Array>} hallazgos
   */
  async detect(_page, { vista }) {
    return this._fallos.map((fallo) => {
      let pathname = fallo.url;
      try {
        pathname = new URL(fallo.url).pathname;
      } catch { /* URL no parseable: se usa la cruda */ }
      const id = stableId({ vista, rol: 'recurso', nombre: pathname, tipo: TIPO });
      return {
        id,
        vista,
        elemento: elementoLabel({ rol: 'recurso', nombre: pathname }),
        tipo: TIPO,
        medida: {
          status: fallo.status,
          metodo: fallo.metodo,
          url: fallo.url,
          peticiones: this._peticiones,
        },
      };
    });
  }
}
