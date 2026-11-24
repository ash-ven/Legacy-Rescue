// Caratterizzazione dei prodotti: difetti compresi. Dove un test fotografa un difetto, il titolo lo dice.
import { expect } from 'chai';
import { api } from '../support/api.mjs';
import { expectGolden } from '../support/golden.mjs';
import { KEYS } from '../support/fixtures.mjs';
import { ids } from '../support/hooks.mjs';

const rossi = () => api(KEYS.rossi);
const bianchi = () => api(KEYS.bianchi);

describe('GET /products (comportamento attuale)', () => {
  it("elenca i prodotti dell'azienda in ordine di sku", async () => {
    expectGolden('products-elenco-rossi', await rossi().get('/products'));
  });

  it('cerca nel nome senza distinguere maiuscole e minuscole', async () => {
    expectGolden('products-ricerca-vit', await rossi().get('/products?search=VIT'));
  });

  it('con low_stock=1 mostra solo i prodotti sotto la scorta minima', async () => {
    expectGolden('products-sotto-scorta', await rossi().get('/products?low_stock=1'));
  });

  it('una ricerca con "(" fa rispondere 500 (oggi)', async () => {
    // Solo lo stato: il corpo è la pagina d'errore di Express con lo stack, non ha senso fotografarlo.
    const res = await rossi().get('/products?search=(');
    expect(res.status).to.equal(500);
  });
});

describe('POST /products (comportamento attuale)', () => {
  it('crea un prodotto e mette qty e minQty a 0 se mancano', async () => {
    expectGolden('products-crea', await rossi().post('/products', { sku: 'PIN-1', name: 'Pinza', price: 9.9 }));
  });

  it('senza sku o nome risponde 400', async () => {
    expectGolden('products-crea-senza-sku', await rossi().post('/products', { name: 'Senza codice' }));
  });

  it("uno sku già usato nella stessa azienda risponde 500 con l'errore di MongoDB", async () => {
    expectGolden('products-crea-sku-doppio', await rossi().post('/products', { sku: 'VIT-4', name: 'Altre viti' }));
  });

  it("lo stesso sku in un'altra azienda è permesso", async () => {
    expectGolden('products-crea-sku-altra-azienda', await bianchi().post('/products', { sku: 'VIT-4', name: 'Vite (pianta)' }));
  });
});

describe('PUT /products/:id (comportamento attuale)', () => {
  it('modifica i campi inviati', async () => {
    expectGolden('products-modifica', await rossi().put(`/products/${ids.martello}`, { price: 13, qty: 10 }));
  });

  it("un prodotto di un'altra azienda risponde 404", async () => {
    expectGolden('products-modifica-altra-azienda', await bianchi().put(`/products/${ids.martello}`, { price: 1 }));
  });

  it("[corretto al passo 5] tenantId nel corpo viene ignorato: il prodotto resta all'azienda", async () => {
    expectGolden('products-modifica-tenant-risposta', await rossi().put(`/products/${ids.martello}`, { tenantId: 'bianchi' }));
    expectGolden('products-modifica-tenant-elenco-bianchi', await bianchi().get('/products'));
  });

  it('un ID non valido risponde 500 (oggi)', async () => {
    const res = await rossi().put('/products/non-un-id', { price: 1 });
    expect(res.status).to.equal(500);
  });
});
