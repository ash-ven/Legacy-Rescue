// "Golden master": la risposta di oggi salvata in test/golden/<nome>.json e confrontata a ogni esecuzione.
// Le fotografie si creano o si aggiornano solo di proposito: npm run test:update-golden
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect } from 'chai';

const DIR = new URL('../golden/', import.meta.url);

// Gli ObjectId cambiano a ogni esecuzione: diventano <id-1>, <id-2>... nell'ordine in cui compaiono.
export function normalize(value) {
  const seen = new Map();
  const text = JSON.stringify(value).replace(/\b[0-9a-f]{24}\b/g, (hex) => {
    if (!seen.has(hex)) seen.set(hex, `<id-${seen.size + 1}>`);
    return seen.get(hex);
  });
  return JSON.parse(text);
}

export function expectGolden(name, res) {
  const record = normalize({
    status: res.status,
    contentType: res.headers['content-type'] ?? null,
    body: res.type === 'application/json' ? res.body : res.text,
  });
  const file = new URL(`${name}.json`, DIR);

  if (process.env.UPDATE_GOLDEN === '1') {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
    return;
  }
  if (!existsSync(file)) {
    throw new Error(`Fotografia mancante: test/golden/${name}.json. Controlla il comportamento e lancia "npm run test:update-golden".`);
  }
  expect(record).to.deep.equal(JSON.parse(readFileSync(file, 'utf8')));
}
