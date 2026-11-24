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

  it('[cambiato al passo 6] la ricerca tratta "(" come testo: nessun risultato invece di 500', async () => {
    const res = await rossi().get('/products?search=(');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal([]);
    expectGolden('products-ricerca-parentesi', res);
  });
});

describe('POST /products (comportamento attuale)', () => {
  it('crea un prodotto e mette qty e minQty a 0 se mancano', async () => {
    expectGolden('products-crea', await rossi().post('/products', { sku: 'PIN-1', name: 'Pinza', price: 9.9 }));
  });

  it('senza sku o nome risponde 400', async () => {
    expectGolden('products-crea-senza-sku', await rossi().post('/products', { name: 'Senza codice' }));
  });

  it('[cambiato al passo 7] uno sku già usato nella stessa azienda risponde 409, senza dettagli del database', async () => {
    const res = await rossi().post('/products', { sku: 'VIT-4', name: 'Altre viti' });
    expect(res.status).to.equal(409);
    expect(res.body).to.deep.equal({ error: 'sku already exists' });
    expectGolden('products-crea-sku-doppio', res);
  });

  it("[cambiato al passo 7] lo stesso sku in un'altra azienda è permesso; il prezzo mancante vale 0", async () => {
    const res = await bianchi().post('/products', { sku: 'VIT-4', name: 'Vite (pianta)' });
    expect(res.body.price).to.equal(0);
    expectGolden('products-crea-sku-altra-azienda', res);
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

  it('[cambiato al passo 6] un ID non valido risponde 400', async () => {
    const res = await rossi().put('/products/non-un-id', { price: 1 });
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ error: 'invalid id' });
    expectGolden('products-modifica-id-non-valido', res);
  });
});
