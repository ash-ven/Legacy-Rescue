// Caratterizzazione del report CSV.
import { api } from '../support/api.mjs';
import { expectGolden } from '../support/golden.mjs';
import { KEYS } from '../support/fixtures.mjs';

describe('GET /reports/low-stock.csv (comportamento attuale)', () => {
  it('[stranezza] i nomi con la virgola non sono tra virgolette: la riga ha una colonna in più', async () => {
    expectGolden('reports-sotto-scorta-rossi', await api(KEYS.rossi).get('/reports/low-stock.csv'));
  });

  it('senza prodotti sotto scorta restituisce solo la riga di intestazione', async () => {
    expectGolden('reports-sotto-scorta-bianchi', await api(KEYS.bianchi).get('/reports/low-stock.csv'));
  });
});
