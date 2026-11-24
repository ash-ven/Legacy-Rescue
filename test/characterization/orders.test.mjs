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
  it('crea un ordine: totale in virgola mobile non arrotondato, data dal momento della richiesta', async () => {
    expectGolden('orders-crea', await ordina(rossi, [{ productId: ids.viti, qty: 3 }]));
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

  it('[stranezza] una quantità negativa crea un ordine con totale negativo e aumenta le scorte', async () => {
    expectGolden('orders-quantita-negativa', await ordina(rossi, [{ productId: ids.viti, qty: -2 }]));
    expect(await scorte(rossi, 'VIT-4')).to.equal(102);
  });

  it('[stranezza] senza articoli crea un ordine vuoto da 0', async () => {
    expectGolden('orders-vuoto', await ordina(rossi, []));
  });

  it("[difetto] si può ordinare un prodotto di un'altra azienda, e se ne scalano le scorte", async () => {
    expectGolden('orders-prodotto-altra-azienda', await ordina(rossi, [{ productId: ids.mele, qty: 5 }]));
    expect(await scorte(bianchi, 'MEL-1')).to.equal(45);
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

  it("[difetto] legge anche il dettaglio di un ordine di un'altra azienda", async () => {
    const creato = await ordina(rossi, [{ productId: ids.viti, qty: 1 }]);
    expectGolden('orders-dettaglio-altra-azienda', await bianchi().get(`/orders/${creato.body._id}`));
  });

  it('un ordine inesistente risponde 404', async () => {
    expectGolden('orders-dettaglio-inesistente', await rossi().get('/orders/000000000000000000000000'));
  });

  it('un ID non valido risponde 500 (oggi)', async () => {
    const res = await rossi().get('/orders/non-un-id');
    expect(res.status).to.equal(500);
  });
});
