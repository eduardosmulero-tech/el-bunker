// tools/audit-ui/playwright/verificar-sin-admin-para-edu.js
// t_0d0b936b — La entrada ADMIN del rail NO aparece con user.id !== "admin".
// Siembra sesión como edu (sin clave real: solo prueba de visibilidad del rail).
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:5174';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await contexto.newPage();
  await page.addInitScript(() => {
    window.addEventListener('load', () => document.querySelectorAll('audio').forEach((a) => a.pause()));
    try {
      sessionStorage.setItem('bunker_jwt', 'audit-fixture-jwt');
      sessionStorage.setItem('bunker_session_kind', 'access_key');
      sessionStorage.setItem('bunker_user', JSON.stringify({ id: 'edu', name: 'Edu', email: 'edu@el-bunker.test', role: 'user', avatar: null }));
    } catch { /* storage bloqueado */ }
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.desktop-rail', { timeout: 20000 });
  await page.waitForTimeout(1500);
  const resultado = await page.evaluate(() => {
    const botones = [...document.querySelectorAll('.desktop-rail button')].map((b) => b.textContent.trim());
    const admin = document.querySelector('.desktop-rail__admin');
    return { botones, hayEntradaAdmin: Boolean(admin) };
  });
  console.log('RAIL COMO edu:', JSON.stringify(resultado));
} finally {
  await browser.close();
}
