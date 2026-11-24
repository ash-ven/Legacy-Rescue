// Caratterizzazione del report CSV.
import { expect } from 'chai';
import { api } from '../support/api.mjs';
import { expectGolden } from '../support/golden.mjs';
import { KEYS } from '../support/fixtures.mjs';

describe('GET /reports/low-stock.csv (comportamento attuale)', () => {
  it('[cambiato al passo 6] i nomi con la virgola sono tra virgolette: ogni riga ha 4 colonne', async () => {
    const res = await api(KEYS.rossi).get('/reports/low-stock.csv');
    expect(res.text).to.include('CHI-8,"Chiodi, 8cm",20,50');
    expectGolden('reports-sotto-scorta-rossi', res);
  });

  it('senza prodotti sotto scorta restituisce solo la riga di intestazione', async () => {
    expectGolden('reports-sotto-scorta-bianchi', await api(KEYS.bianchi).get('/reports/low-stock.csv'));
  });
});
