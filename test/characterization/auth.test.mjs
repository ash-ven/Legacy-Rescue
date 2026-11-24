// Caratterizzazione: fotografa cosa fa l'API OGGI, non cosa dovrebbe fare.
import { api } from '../support/api.mjs';
import { expectGolden } from '../support/golden.mjs';

describe('Autenticazione (comportamento attuale)', () => {
  it('senza chiave risponde 401 "missing api key"', async () => {
    expectGolden('auth-senza-chiave', await api().get('/products'));
  });

  it('con una chiave sconosciuta risponde 401 "invalid api key"', async () => {
    expectGolden('auth-chiave-sconosciuta', await api('chiave-che-non-esiste').get('/products'));
  });
});
