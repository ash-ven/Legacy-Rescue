// Test di accettazione sull'isolamento tra aziende: descrivono come DEVE funzionare.
// I tre del gruppo "corretto al passo 5" erano in pausa (it.skip) al passo 4, quando fallivano;
// la correzione li ha riattivati e ora sono la prova che il difetto non torna.
import { expect } from 'chai';
import { api } from '../support/api.mjs';
import { KEYS } from '../support/fixtures.mjs';
import { ids } from '../support/hooks.mjs';

const rossi = () => api(KEYS.rossi);
const bianchi = () => api(KEYS.bianchi);
const skus = (res) => res.body.map((p) => p.sku);

describe('Isolamento tra aziende', () => {
  describe('già garantito oggi', () => {
    it('ogni azienda vede solo i propri prodotti', async () => {
      expect(skus(await rossi().get('/products'))).to.have.members(['CHI-8', 'MAR-1', 'VIT-4']);
      expect(skus(await bianchi().get('/products'))).to.have.members(['MEL-1']);
    });

    it('ogni azienda vede solo i propri ordini', async () => {
      await rossi().post('/orders', { items: [{ productId: ids.viti, qty: 1 }] });
      await bianchi().post('/orders', { items: [{ productId: ids.mele, qty: 1 }] });
      const res = await rossi().get('/orders');
      expect(res.body).to.have.length(1);
      expect(res.body[0].tenantId).to.equal('rossi');
    });

    it("il report CSV non contiene prodotti di un'altra azienda", async () => {
      await bianchi().put(`/products/${ids.mele}`, { qty: 1 }); // Mele sotto scorta per Bianchi
      const res = await rossi().get('/reports/low-stock.csv');
      expect(res.text).to.not.include('MEL-1');
    });

    it("non si modifica un prodotto di un'altra azienda", async () => {
      const res = await bianchi().put(`/products/${ids.martello}`, { price: 1 });
      expect(res.status).to.equal(404);
    });
  });

  describe('corretto al passo 5', () => {
    it("un'azienda non può leggere l'ordine di un'altra: 404", async () => {
      const ordine = await rossi().post('/orders', { items: [{ productId: ids.viti, qty: 1 }] });
      const res = await bianchi().get(`/orders/${ordine.body._id}`);
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ error: 'order not found' });
    });

    it("modificare un prodotto non può cambiarne l'azienda", async () => {
      const res = await rossi().put(`/products/${ids.martello}`, { tenantId: 'bianchi', price: 13 });
      expect(res.status).to.equal(200);
      expect(res.body.tenantId).to.equal('rossi');
      expect(res.body.price).to.equal(13);
      expect(skus(await bianchi().get('/products'))).to.not.include('MAR-1');
    });

    it("un ordine non può usare i prodotti di un'altra azienda: 404, scorte intatte", async () => {
      const res = await rossi().post('/orders', { items: [{ productId: ids.mele, qty: 5 }] });
      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ error: 'product not found' });
      const mele = (await bianchi().get('/products')).body.find((p) => p.sku === 'MEL-1');
      expect(mele.qty).to.equal(50);
    });
  });
});
