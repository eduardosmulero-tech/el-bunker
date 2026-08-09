// tools/audit-ui/playwright/measure-page.js
// Orquesta la medición de UNA página en UN viewport: detectores estáticos
// (truncamiento, desbordamiento) + colectores de eventos (consola, red).
// Compartido por run.mjs (app real sobre fixtures) y el test de la trampa.
import { TruncatedTextDetector } from './detectors/truncated-text-detector.js';
import { HorizontalOverflowDetector } from './detectors/horizontal-overflow-detector.js';
import { ConsoleErrorDetector } from './detectors/console-error-detector.js';
import { HttpStatusDetector } from './detectors/http-status-detector.js';

/**
 * Crea los colectores de eventos. Llama a attach(page) ANTES de navegar y a
 * measure(page, ctx) cuando la página ya está estable.
 */
export function createCollectors() {
  const consoleDetector = new ConsoleErrorDetector();
  const httpDetector = new HttpStatusDetector();

  return {
    attach(page) {
      consoleDetector.attach(page);
      httpDetector.attach(page);
    },
    detach(page) {
      consoleDetector.detach(page);
      httpDetector.detach(page);
    },
    /**
     * @param {import('playwright').Page} page
     * @param {{ screenKey: string, viewport: { width: number, height: number } }} ctx
     * @returns {Promise<Array>} hallazgos deduplicados por id
     */
    async measure(page, { screenKey, viewport }) {
      const vista = `${screenKey}@${viewport.width}x${viewport.height}`;
      const estaticos = [
        new TruncatedTextDetector(),
        new HorizontalOverflowDetector(),
      ];

      const crudos = [];
      for (const detector of estaticos) {
        crudos.push(...(await detector.detect(page, { vista, viewport })));
      }
      crudos.push(...(await consoleDetector.detect(page, { vista })));
      crudos.push(...(await httpDetector.detect(page, { vista })));

      // Dedupe por id: el contrato define el mismo defecto con la misma
      // identidad accesible como UN hallazgo (repeticiones en el payload).
      const porId = new Map();
      for (const hallazgo of crudos) {
        const previo = porId.get(hallazgo.id);
        if (previo) {
          previo.medida.repeticiones = (previo.medida.repeticiones ?? 1) + 1;
        } else {
          porId.set(hallazgo.id, hallazgo);
        }
      }
      return [...porId.values()];
    },
  };
}
