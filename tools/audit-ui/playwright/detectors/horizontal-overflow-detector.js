// tools/audit-ui/playwright/detectors/horizontal-overflow-detector.js
// (b) Desbordamiento horizontal del documento:
//     documentElement.scrollWidth > documentElement.clientWidth.
//     Un hallazgo por página/vista (el elemento es el propio documento).
import { stableId, elementoLabel } from './stable-id.js';

const TIPO = 'desbordamiento_horizontal';

export class HorizontalOverflowDetector {
  /**
   * @param {import('playwright').Page} page
   * @param {{ vista: string, viewport: { width: number, height: number } }} ctx
   * @returns {Promise<Array>} hallazgos
   */
  async detect(page, { vista, viewport }) {
    const raw = await page.evaluate(`(() => {
  const doc = document.documentElement;
  const scrollWidth = doc.scrollWidth;
  const clientWidth = doc.clientWidth;
  if (scrollWidth <= clientWidth) return null;
  return {
    scrollWidth,
    clientWidth,
    titulo: document.title || 'sin título',
  };
})()`);

    if (!raw) return [];

    const id = stableId({ vista, rol: 'documento', nombre: raw.titulo, tipo: TIPO });
    return [{
      id,
      vista,
      elemento: elementoLabel({ rol: 'documento', nombre: raw.titulo }),
      tipo: TIPO,
      medida: {
        scrollWidth: raw.scrollWidth,
        clientWidth: raw.clientWidth,
        viewportWidth: viewport.width,
      },
    }];
  }
}
