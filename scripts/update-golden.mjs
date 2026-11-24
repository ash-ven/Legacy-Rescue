// Riscrive le fotografie (test/golden) con il comportamento attuale. Va usato solo di proposito,
// poi si rilegge "git diff test/golden" prima di fare commit. Funziona uguale su Windows, macOS e Linux.
// Esempio: npm run test:update-golden -- --grep "CSV"
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const mocha = createRequire(import.meta.url).resolve('mocha/bin/mocha.js');
const result = spawnSync(process.execPath, [mocha, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, UPDATE_GOLDEN: '1' },
});
process.exit(result.status ?? 1);
