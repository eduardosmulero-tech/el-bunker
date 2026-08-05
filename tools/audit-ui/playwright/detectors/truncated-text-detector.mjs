// tools/audit-ui/playwright/detectors/truncated-text-detector.mjs
import type { Page } from '@playwright/test';

export class TruncatedTextDetector {
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
                        const id = generateStableId(el, viewport, 'truncated_text');
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
}

function generateStableId(element, viewport, defectType) {
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