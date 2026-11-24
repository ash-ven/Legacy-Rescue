import { expect } from 'chai';
import validation from '../../src/validation.js';

const { isValidId, parseOrderItems } = validation;

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
