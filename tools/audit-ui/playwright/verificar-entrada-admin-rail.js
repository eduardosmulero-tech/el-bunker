// tools/audit-ui/playwright/verificar-entrada-admin-rail.js
// t_0d0b936b — Evidencia desktop de la entrada ADMIN del rail:
// 1. login como admin por clave ADR-028 (ACCESO TEST / ADMIN)
// 2. rail desktop con la cuarta entrada ADMIN (icono shield + filete)
// 3. clic en ADMIN navega a /admin
// Uso: BUNKER_KEY=$(tr -d '\r\n' < C:/proyectos/.trabajo/bunker_admin_key.txt) node verificar-entrada-admin-rail.js
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'report', 'capturas-rev', 'admin-rail');
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL || 'http://localhost:5174';
const KEY = process.env.BUNKER_KEY || '';

if (!KEY) {
  console.error('FALTA BUNKER_KEY (clave ADR-028). Abortando.');
  process.exit(2);
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await contexto.newPage();

  // Silencio inmediato: pausar cualquier audio al arrancar (regla 4-ago).
  await page.addInitScript(() => {
    const pausar = () => document.querySelectorAll('audio').forEach((a) => a.pause());
    window.addEventListener('load', pausar);
    setInterval(pausar, 2000);
  });

  page.on('console', (m) => console.log(`[consola ${m.type()}]`, m.text().slice(0, 200)));
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));

  // 1. LOGIN COMO ADMIN (ADR-028)
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('ACCESO TEST / ADMIN')), { timeout: 20000 });
  await page.getByRole('button', { name: /ACCESO TEST \/ ADMIN/ }).click();
  await page.waitForSelector('#bunker-access-key', { timeout: 10000 });
  await page.fill('#bunker-access-key', KEY);
  await page.getByRole('button', { name: /ENTRAR/ }).click();

  // Tras el canje: el rail desktop debe montarse (Layout autenticado).
  await page.waitForSelector('.desktop-rail', { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, '1-login-admin-rail.png'), fullPage: false });

  // 2. EVIDENCIA DEL RAIL: cuarta entrada ADMIN, icono shield, filete.
  const adminBtn = page.locator('.desktop-rail__admin button.desktop-rail__destination');
  const adminInfo = await adminBtn.evaluate((el) => {
    const svg = el.querySelector('svg');
    const divider = el.closest('.desktop-rail__admin')?.querySelector('.desktop-rail__divider');
    return {
      texto: el.textContent.trim(),
      iconoShield: Boolean(svg),
      filete: Boolean(divider),
      botonesRail: [...el.closest('.desktop-rail').querySelectorAll('button')].map((b) => b.textContent.trim()),
    };
  });
  console.log('RAIL ADMIN:', JSON.stringify(adminInfo));

  // 3. CLIC EN ADMIN -> /admin
  await adminBtn.click();
  await page.waitForURL(/(\/admin|\/admin\/)/, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, '2-admin-despues-clic.png'), fullPage: false });
  const urlFinal = page.url();
  const cuerpoAdmin = await page.evaluate(() => (document.body.textContent || '').slice(0, 300));
  console.log('URL TRAS CLIC:', urlFinal);
  console.log('CUERPO ADMIN (inicio):', JSON.stringify(cuerpoAdmin.slice(0, 200)));
} finally {
  await browser.close();
}
