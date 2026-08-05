// tools/audit-ui/run.mjs
import { runAudit } from './playwright/page-auditor.mjs';

async function main() {
    console.log('Starting audit...');
    await runAudit();
    console.log('Audit completed successfully');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Audit failed:', error);
        process.exit(1);
    });
}