import { expect } from 'chai';
import validation from '../../src/validation.js';

const { isValidId, parseOrderItems, parseNewProduct, parseProductChanges } = validation;

const ID = '6b0550bee3626f9fc1bbe671';

const rifiuta = (items) => {
  try {
    parseOrderItems(items);
  } catch (err) {
    return err;
  }
  throw new Error('doveva rifiutare gli articoli');
};

describe('isValidId', () => {
  it('accetta un ObjectId di 24 caratteri esadecimali', () => {
    expect(isValidId(ID)).to.equal(true);
  });

  it('rifiuta un testo qualsiasi', () => {
    expect(isValidId('non-un-id')).to.equal(false);
  });

  it('rifiuta una stringa di 12 caratteri (che il driver accetterebbe come ID)', () => {
    expect(isValidId('aaaaaaaaaaaa')).to.equal(false);
  });

  it('rifiuta valori che non sono testo', () => {
    expect(isValidId(undefined)).to.equal(false);
    expect(isValidId(123)).to.equal(false);
  });
});

describe('parseOrderItems', () => {
  it('restituisce solo productId e qty degli articoli validi', () => {
    expect(parseOrderItems([{ productId: ID, qty: 2, price: 0 }])).to.deep.equal([{ productId: ID, qty: 2 }]);
  });

  it('rifiuta un ordine senza articoli con 400 "invalid items"', () => {
    const err = rifiuta([]);
    expect(err.status).to.equal(400);
    expect(err.message).to.equal('invalid items');
  });

  it('rifiuta un ordine senza il campo items', () => {
    expect(rifiuta(undefined).status).to.equal(400);
  });

  it('rifiuta quantità zero, negative, decimali o scritte come testo', () => {
    for (const qty of [0, -1, 1.5, '3']) {
      expect(rifiuta([{ productId: ID, qty }]).status, `qty ${JSON.stringify(qty)}`).to.equal(400);
    }
  });

  it('rifiuta un productId non valido', () => {
    expect(rifiuta([{ productId: 'abc', qty: 1 }]).status).to.equal(400);
  });
});

// Aggiunti al passo 7 (revisione indipendente).
const errore = (fn) => {
  try {
    fn();
  } catch (err) {
    return err;
  }
  throw new Error('doveva lanciare un errore');
};

describe('isValidId (passo 7)', () => {
  it('rifiuta le lettere maiuscole, che il confronto con gli ID del database non riconoscerebbe', () => {
    expect(isValidId(ID.toUpperCase())).to.equal(false);
  });
});

describe('parseOrderItems (passo 7)', () => {
  it('rifiuta lo stesso prodotto ripetuto nello stesso ordine', () => {
    expect(rifiuta([{ productId: ID, qty: 60 }, { productId: ID, qty: 60 }]).status).to.equal(400);
  });
});

describe('parseNewProduct', () => {
  it('tiene solo i campi permessi e mette a 0 prezzo e quantità mancanti', () => {
    const body = { sku: 'PIN-1', name: 'Pinza', _id: 'scelto-dal-client', tenantId: 'bianchi', extra: true };
    expect(parseNewProduct(body)).to.deep.equal({ sku: 'PIN-1', name: 'Pinza', price: 0, qty: 0, minQty: 0 });
  });

  it('senza sku o nome risponde 400 "sku and name are required"', () => {
    const err = errore(() => parseNewProduct({ name: 'Senza codice' }));
    expect(err.status).to.equal(400);
    expect(err.message).to.equal('sku and name are required');
  });

  it('rifiuta prezzi e quantità non validi con 400 "invalid product"', () => {
    for (const campi of [{ price: -1 }, { price: 'abc' }, { qty: 1.5 }, { qty: -1 }, { minQty: '5' }]) {
      const err = errore(() => parseNewProduct({ sku: 'A', name: 'B', ...campi }));
      expect(err.status, JSON.stringify(campi)).to.equal(400);
      expect(err.message).to.equal('invalid product');
    }
  });
});

describe('parseProductChanges', () => {
  it('tiene solo i campi modificabili', () => {
    expect(parseProductChanges({ tenantId: 'bianchi', sku: 'X', price: 2, qty: 4 })).to.deep.equal({ price: 2, qty: 4 });
  });

  it('rifiuta una quantità non numerica con 400 "invalid product"', () => {
    const err = errore(() => parseProductChanges({ qty: 'abc' }));
    expect(err.status).to.equal(400);
    expect(err.message).to.equal('invalid product');
  });

  it('rifiuta un nome vuoto', () => {
    expect(errore(() => parseProductChanges({ name: '' })).status).to.equal(400);
  });
});
