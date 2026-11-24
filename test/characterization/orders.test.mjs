// Caratterizzazione degli ordini: difetti e stranezze compresi. Dove un test fotografa un difetto, il titolo lo dice.
import { expect } from 'chai';
import { api } from '../support/api.mjs';
import { expectGolden } from '../support/golden.mjs';
import { KEYS } from '../support/fixtures.mjs';
import { ids } from '../support/hooks.mjs';

const rossi = () => api(KEYS.rossi);
const bianchi = () => api(KEYS.bianchi);
const ordina = (who, items) => who().post('/orders', { items });
const scorte = async (who, sku) => (await who().get('/products')).body.find((p) => p.sku === sku).qty;

describe('POST /orders (comportamento attuale)', () => {
  it('[cambiato al passo 6] crea un ordine: totale arrotondato ai centesimi, data dal momento della richiesta', async () => {
    const res = await ordina(rossi, [{ productId: ids.viti, qty: 3 }]);
    expect(res.body.total).to.equal(0.3);
    expectGolden('orders-crea', res);
  });

  it('scala le scorte dei prodotti ordinati', async () => {
    await ordina(rossi, [{ productId: ids.viti, qty: 3 }]);
    expect(await scorte(rossi, 'VIT-4')).to.equal(97);
  });

  it("avvisa l'azienda con una POST al suo webhook", async () => {
    const res = await ordina(rossi, [{ productId: ids.viti, qty: 3 }]);
    expect(fetch.calledOnce).to.equal(true);
    const [url, options] = fetch.firstCall.args;
    expect(url).to.equal('https://example.test/hooks/rossi');
    expect(options.method).to.equal('POST');
    expect(JSON.parse(options.body)).to.deep.equal({ event: 'order.created', orderId: res.body._id });
  });

  it("se il webhook dell'azienda non risponde, l'ordine viene creato lo stesso", async () => {
    fetch.rejects(new Error('webhook irraggiungibile'));
    const res = await ordina(rossi, [{ productId: ids.viti, qty: 1 }]);
    expect(res.status).to.equal(201);
  });

  it('con scorte insufficienti risponde 400 e non scala niente', async () => {
    expectGolden('orders-scorte-insufficienti', await ordina(rossi, [{ productId: ids.martello, qty: 4 }]));
    expect(await scorte(rossi, 'MAR-1')).to.equal(3);
  });

  it('con un prodotto inesistente risponde 404', async () => {
    expectGolden('orders-prodotto-inesistente', await ordina(rossi, [{ productId: '000000000000000000000000', qty: 1 }]));
  });

  it('[cambiato al passo 6] una quantità negativa viene rifiutata: 400 e scorte intatte', async () => {
    const res = await ordina(rossi, [{ productId: ids.viti, qty: -2 }]);
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ error: 'invalid items' });
    expectGolden('orders-quantita-negativa', res);
    expect(await scorte(rossi, 'VIT-4')).to.equal(100);
  });

  it('[cambiato al passo 6] un ordine senza articoli viene rifiutato: 400', async () => {
    const res = await ordina(rossi, []);
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ error: 'invalid items' });
    expectGolden('orders-vuoto', res);
  });

  it('[cambiato al passo 6] un productId non valido viene rifiutato: 400', async () => {
    const res = await ordina(rossi, [{ productId: 'non-un-id', qty: 1 }]);
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ error: 'invalid items' });
  });

  it("[corretto al passo 5] un prodotto di un'altra azienda risulta inesistente e le sue scorte non cambiano", async () => {
    expectGolden('orders-prodotto-altra-azienda', await ordina(rossi, [{ productId: ids.mele, qty: 5 }]));
    expect(await scorte(bianchi, 'MEL-1')).to.equal(50);
  });
});

describe('GET /orders e /orders/:id (comportamento attuale)', () => {
  it("l'elenco mostra solo gli ordini dell'azienda", async () => {
    await ordina(rossi, [{ productId: ids.viti, qty: 1 }]);
    await ordina(bianchi, [{ productId: ids.mele, qty: 1 }]);
    expectGolden('orders-elenco-rossi', await rossi().get('/orders'));
  });

  it('legge il dettaglio di un proprio ordine', async () => {
    const creato = await ordina(rossi, [{ productId: ids.viti, qty: 1 }]);
    expectGolden('orders-dettaglio', await rossi().get(`/orders/${creato.body._id}`));
  });

  it("[corretto al passo 5] l'ordine di un'altra azienda risulta inesistente", async () => {
    const creato = await ordina(rossi, [{ productId: ids.viti, qty: 1 }]);
    expectGolden('orders-dettaglio-altra-azienda', await bianchi().get(`/orders/${creato.body._id}`));
  });

  it('un ordine inesistente risponde 404', async () => {
    expectGolden('orders-dettaglio-inesistente', await rossi().get('/orders/000000000000000000000000'));
  });

  it('[cambiato al passo 6] un ID non valido risponde 400', async () => {
    const res = await rossi().get('/orders/non-un-id');
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({ error: 'invalid id' });
    expectGolden('orders-dettaglio-id-non-valido', res);
  });
});
