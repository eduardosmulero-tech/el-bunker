// @vitest-environment node
// DoD AUD-1: la página trampa (tools/audit-ui/fixture-page/trampa.html) tiene
// UN título cortado a 100 px, UN botón de 20x20 y UN console.error; el medidor
// debe emitir EXACTAMENTE 3 hallazgos, uno de cada tipo. Si el medidor deja de
// medir, este test se pone rojo.
import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright';
import { createCollectors } from '../playwright/measure-page.js';

const TRAMPA_URL = new URL('../fixture-page/trampa.html', import.meta.url).href;
const VIEWPORT = { width: 390, height: 844 };

describe('AUD-1 — página trampa', () => {
  it('el medidor emite exactamente 3 hallazgos, uno de cada tipo', async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
      const contexto = await browser.newContext({ viewport: VIEWPORT });
      const page = await contexto.newPage();

      const colectores = createCollectors();
      colectores.attach(page);

      await page.goto(TRAMPA_URL, { waitUntil: 'load' });
      await page.waitForTimeout(300);

      const hallazgos = await colectores.measure(page, {
        screenKey: 'trampa',
        viewport: VIEWPORT,
      });

      expect(hallazgos).toHaveLength(3);
      expect(new Set(hallazgos.map((h) => h.tipo))).toEqual(
        new Set(['truncamiento', 'desbordamiento_horizontal', 'error_consola'])
      );

      for (const hallazgo of hallazgos) {
        expect(hallazgo.id).toMatch(/^[0-9a-f]{12}$/);
        expect(hallazgo.vista).toBe('trampa@390x844');
        expect(hallazgo.medida).toBeDefined();
      }
    } finally {
      await browser.close();
    }
  }, 60000);
});
