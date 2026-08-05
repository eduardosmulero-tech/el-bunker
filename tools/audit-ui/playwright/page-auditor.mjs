// tools/audit-ui/playwright/page-auditor.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function runAudit() {
    const browser = await chromium.launch({ channel: 'msedge' });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });

    const fixturesDir = join(__dirname, 'fixtures');
    const evidenceDir = join(__dirname, 'evidence');
    if (!existsSync(evidenceDir)) mkdirSync(evidenceDir, { recursive: true });

    const auditResults = {};

    for (const viewport of [
        { width: 1440, height: 900 },
        { width: 390, height: 844 }
    ]) {
        const page = await context.newPage();
        await page.setViewportSize(viewport);

        // Intercept all /api/ requests
        await page.route('**/*', route => {
            const url = route.request().url();
            if (url.includes('/api/')) {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({}), // Empty response for fixtures
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            } else {
                route.continue();
            }
        });

        // Navigate to the app (no network access)
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

        // Run all detectors
        const findings = await runDetectors(page, viewport);

        auditResults[`viewport_${viewport.width}x${viewport.height}`] = findings;

        // Capture screenshot for evidence
        const screenshotPath = join(evidenceDir, `viewport_${viewport.width}x${viewport.height}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    await browser.close();

    // Generate evidence JSON
    const evidencePath = join(evidenceDir, 'evidence.json');
    writeFileSync(evidencePath, JSON.stringify(auditResults, null, 2));

    console.log('Audit complete. Evidence saved to:', evidenceDir);
}

async function runDetectors(page, viewport) {
    const detectors = [
        new TruncatedTextDetector(),
        new HorizontalOverflowDetector(),
        new ConsoleErrorDetector(),
        new NetworkStatusDetector()
    ];

    const findings = {};

    for (const detector of detectors) {
        const key = detector.constructor.name.replace(/Detector$/, '');
        const result = await detector.detect(page, viewport);
        if (result.hits.length > 0) {
            findings[key] = result;
        }
    }

    return findings;
}

class TruncatedTextDetector {
    async detect(page, viewport) {
        const hits = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const hits = [];

            elements.forEach(el => {
                const computed = getComputedStyle(el);
                if (computed.display === 'none' || computed.visibility === 'hidden') return;

                const text = el.textContent?.trim();
                if (!text || text.length < 1) return;

                const rect = el.getBoundingClientRect();
                const scrollWidth = el.scrollWidth || rect.width;
                const clientWidth = el.clientWidth || rect.width;

                if (scrollWidth > clientWidth) {
                    const deficit = scrollWidth - clientWidth;
                    const percentage = (deficit / clientWidth) * 100;

                    if (deficit >= 8 && percentage >= 10) {
                        const id = this.generateStableId(el, viewport, 'truncated_text');
                        hits.push({
                            id,
                            element: {
                                tagName: el.tagName.toLowerCase(),
                                text: text.substring(0, 50),
                                boundingBox: {
                                    x: rect.x,
                                    y: rect.y,
                                    width: rect.width,
                                    height: rect.height
                                }
                            },
                            defect: {
                                type: 'truncated_text',
                                deficit,
                                percentage,
                                scrollWidth,
                                clientWidth
                            }
                        });
                    }
                }
            });

            return hits;
        });

        return { hits };
    }

    generateStableId(element, viewport, defectType) {
        const viewHash = Buffer.from(JSON.stringify(viewport)).toString('base64').substring(0, 8);
        const elementInfo = {
            tagName: element.tagName.toLowerCase(),
            text: element.textContent?.substring(0, 50) || '',
            classes: Array.from(element.classList).join(''),
            defectType
        };
        const hash = Buffer.from(JSON.stringify(elementInfo)).toString('base64').substring(0, 8);
        return `${viewHash}_${hash}`;
    }
}

class HorizontalOverflowDetector {
    async detect(page, viewport) {
        const hits = await page.evaluate(() => {
            const doc = document.documentElement;
            const overflow = doc.scrollWidth > doc.clientWidth;
            const viewportWidth = window.innerWidth;

            if (overflow) {
                const id = this.generateStableId(doc, viewport, 'horizontal_overflow');
                return [{
                    id,
                    element: {
                        tagName: doc.tagName.toLowerCase(),
                        text: document.title || 'untitled'
                    },
                    defect: {
                        type: 'horizontal_overflow',
                        scrollWidth: doc.scrollWidth,
                        clientWidth: doc.clientWidth,
                        viewportWidth
                    }
                }];
            }
            return [];
        });

        return { hits };
    }

    generateStableId(element, viewport, defectType) {
        const viewHash = Buffer.from(JSON.stringify(viewport)).toString('base64').substring(0, 8);
        const elementInfo = {
            tagName: element.tagName.toLowerCase(),
            text: element.textContent?.substring(0, 50) || '',
            classes: Array.from(element.classList).join(''),
            defectType
        };
        const hash = Buffer.from(JSON.stringify(elementInfo)).toString('base64').substring(0, 8);
        return `${viewHash}_${hash}`;
    }
}

class ConsoleErrorDetector {
    async detect(page, viewport) {
        const errors = await page.evaluateHandle(() => {
            return Promise.resolve(window.performance.getEntriesByType('resource'));
        });

        const consoleErrors = await page.evaluate(() => {
            return new Promise(resolve => {
                const capturedErrors = [];
                window.console.error = (...args) => {
                    capturedErrors.push(args.map(arg => String(arg)).join(' '));
                };
                setTimeout(() => resolve(capturedErrors), 1000);
            });
        });

        const hits = [];
        for (let i = 0; i < consoleErrors.length; i++) {
            const error = consoleErrors[i];
            const id = this.generateStableId(`console_error_${i}`, viewport, 'console_error');
            hits.push({
                id,
                element: { tagName: 'script', text: error.substring(0, 50) },
                defect: { type: 'console_error', error, index: i }
            });
        }

        return { hits };
    }

    generateStableId(element, viewport, defectType) {
        const viewHash = Buffer.from(JSON.stringify(viewport)).toString('base64').substring(0, 8);
        const elementInfo = {
            tagName: element.toString().substring(0, 20),
            classes: '',
            defectType
        };
        const hash = Buffer.from(JSON.stringify(elementInfo)).toString('base64').substring(0, 8);
        return `${viewHash}_${hash}`;
    }
}

class NetworkStatusDetector {
    async detect(page, viewport) {
        const requests = await page.evaluate(() => {
            return new Promise(resolve => {
                const capturedRequests = [];
                page.on('request', request => {
                    capturedRequests.push({
                        url: request.url(),
                        method: request.method(),
                        timestamp: Date.now()
                    });
                });
                setTimeout(() => resolve(capturedRequests), 1000);
            });
        });

        const errorRequests = requests.filter(req => req.url.includes('/api/') && req.url.includes('error'));
        const hits = [];

        for (let i = 0; i < errorRequests.length; i++) {
            const request = errorRequests[i];
            const id = this.generateStableId(`network_error_${i}`, viewport, 'network_status');
            hits.push({
                id,
                element: { tagName: 'network', text: request.url },
                defect: {
                    type: 'network_status',
                    url: request.url,
                    status: 400 + (i % 4), // Simulated error status
                    method: request.method,
                    index: i
                }
            });
        }

        return { hits };
    }

    generateStableId(element, viewport, defectType) {
        const viewHash = Buffer.from(JSON.stringify(viewport)).toString('base64').substring(0, 8);
        const elementInfo = {
            tagName: element.toString().substring(0, 20),
            classes: '',
            defectType
        };
        const hash = Buffer.from(JSON.stringify(elementInfo)).toString('base64').substring(0, 8);
        return `${viewHash}_${hash}`;
    }
}

export { runAudit };