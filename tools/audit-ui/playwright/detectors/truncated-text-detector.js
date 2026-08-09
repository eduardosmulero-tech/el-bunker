// tools/audit-ui/playwright/detectors/truncated-text-detector.js
// (a) Texto truncado: scrollWidth > clientWidth, solo si el déficit es
//     >= 8px Y >= 10% de lo que necesita (scrollWidth). Solo cuenta si la
//     caja realmente recorta (overflow-x hidden/clip): las tiras con scroll
//     horizontal intencional (overflow-x auto) NO son truncamiento.
import { stableId, inPageIdentity, elementoLabel } from './stable-id.js';

const TIPO = 'truncamiento';

export class TruncatedTextDetector {
  /**
   * @param {import('playwright').Page} page
   * @param {{ vista: string }} ctx
   * @returns {Promise<Array>} hallazgos
   */
  async detect(page, { vista }) {
    // inPageIdentity se incrusta serializada dentro del código evaluado:
    // page.evaluate no puede capturar imports del módulo. El cuerpo va en un
    // IIFE porque `return` a nivel de top-level es ilegal en eval.
    const inPage = `(${inPageIdentity.toString()})`;
    const raw = await page.evaluate(`(() => {
const inPageIdentity = ${inPage};
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TITLE', 'META', 'LINK', 'HEAD']);
const CLIP = new Set(['hidden', 'clip']);
const hits = [];
for (const el of document.querySelectorAll('*')) {
  if (SKIP_TAGS.has(el.tagName)) continue;
  if (el === document.body || el === document.documentElement) continue;
  if (el.closest('head, script, style, noscript, template')) continue;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') continue;
  const text = (el.textContent || '').trim();
  if (!text) continue;
  if (!CLIP.has(cs.overflowX)) continue;
  const scrollWidth = el.scrollWidth;
  const clientWidth = el.clientWidth;
  if (scrollWidth <= clientWidth) continue;
  const deficit = scrollWidth - clientWidth;
  if (deficit < 8) continue;
  if ((deficit / scrollWidth) * 100 < 10) continue;
  const identidad = inPageIdentity(el);
  hits.push({
    rol: identidad.rol,
    nombre: identidad.nombre,
    necesita: scrollWidth,
    disponible: clientWidth,
    deficit,
  });
}
return hits;
})()`);

    return raw.map((h) => {
      const id = stableId({ vista, rol: h.rol, nombre: h.nombre, tipo: TIPO });
      return {
        id,
        vista,
        elemento: elementoLabel({ rol: h.rol, nombre: h.nombre }),
        tipo: TIPO,
        medida: {
          necesita: h.necesita,
          disponible: h.disponible,
          deficit: h.deficit,
        },
      };
    });
  }
}
