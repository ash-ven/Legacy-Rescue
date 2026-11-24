// Passo 7: i problemi trovati dalla revisione indipendente, ognuno con il suo test.
import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import { api } from '../support/api.mjs';
import { buildApp } from '../support/app.mjs';
import { KEYS } from '../support/fixtures.mjs';
import { getDb, ids } from '../support/hooks.mjs';

const rossi = () => api(KEYS.rossi);
const scorte = async (sku) => (await rossi().get('/products')).body.find((p) => p.sku === sku).qty;

describe('Correzioni dalla revisione (passo 7)', () => {
  describe('scorte', () => {
    it('lo stesso prodotto ripetuto nello stesso ordine viene rifiutato: 400 e scorte intatte', async () => {
      const res = await rossi().post('/orders', {
        items: [{ productId: ids.viti, qty: 60 }, { productId: ids.viti, qty: 60 }],
      });
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'invalid items' });
      expect(await scorte('VIT-4')).to.equal(100);
    });

    it("due ordini contemporanei sull'ultima scorta: ne passa uno solo e le scorte non vanno sotto zero", async () => {
      const ordine = () => rossi().post('/orders', { items: [{ productId: ids.martello, qty: 3 }] });
      const stati = (await Promise.all([ordine(), ordine()])).map((r) => r.status).sort();
      expect(stati).to.deep.equal([201, 400]);
      expect(await scorte('MAR-1')).to.equal(0);
    });

    it('un productId scritto in maiuscolo viene rifiutato come non valido (400), non come inesistente', async () => {
      const res = await rossi().post('/orders', { items: [{ productId: ids.viti.toUpperCase(), qty: 1 }] });
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'invalid items' });
    });
  });

  describe('prodotti', () => {
    it('la creazione ignora _id, tenantId e i campi non previsti inviati dal client', async () => {
      const res = await rossi().post('/products', {
        sku: 'PIN-1', name: 'Pinza', price: 9.9, _id: '000000000000000000000abc', tenantId: 'bianchi', sconto: 50,
      });
      expect(res.status).to.equal(201);
      expect(res.body.tenantId).to.equal('rossi');
      expect(res.body._id).to.not.equal('000000000000000000000abc');
      expect(res.body).to.not.have.property('sconto');
    });

    it('la creazione con una quantità non numerica risponde 400 "invalid product"', async () => {
      const res = await rossi().post('/products', { sku: 'PIN-1', name: 'Pinza', qty: 'abc' });
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'invalid product' });
    });

    it('la modifica con una quantità non numerica risponde 400 e non tocca il prodotto', async () => {
      const res = await rossi().put(`/products/${ids.martello}`, { qty: 'abc' });
      expect(res.status).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'invalid product' });
      expect(await scorte('MAR-1')).to.equal(3);
    });
  });

  describe('errori', () => {
    it('un corpo JSON malformato risponde 400 in JSON, senza stack né percorsi del server', async () => {
      const res = await request(buildApp(getDb()))
        .post('/products')
        .set('x-api-key', KEYS.rossi)
        .set('content-type', 'application/json')
        .send('{malformato');
      expect(res.status).to.equal(400);
      expect(res.type).to.equal('application/json');
      expect(res.body).to.deep.equal({ error: 'invalid json' });
    });

    it('un errore inatteso risponde 500 con un messaggio generico, senza dettagli interni', async () => {
      sinon.stub(getDb(), 'collection').throws(new TypeError('dettaglio interno'));
      const res = await rossi().get('/products');
      expect(res.status).to.equal(500);
      expect(res.type).to.equal('application/json');
      expect(res.body).to.deep.equal({ error: 'internal error' });
    });
  });
});
