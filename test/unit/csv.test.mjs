import { expect } from 'chai';
import csv from '../../src/csv.js';

const { toCsvField, toCsvRow } = csv;

describe('CSV (RFC 4180)', () => {
  it("lascia com'è un testo senza caratteri speciali", () => {
    expect(toCsvField('Martello')).to.equal('Martello');
  });

  it('mette tra virgolette un testo con la virgola', () => {
    expect(toCsvField('Viti, 4mm')).to.equal('"Viti, 4mm"');
  });

  it('raddoppia le virgolette interne', () => {
    expect(toCsvField('Vite "a croce"')).to.equal('"Vite ""a croce"""');
  });

  it('mette tra virgolette un testo che va a capo', () => {
    expect(toCsvField('riga uno\nriga due')).to.equal('"riga uno\nriga due"');
  });

  it('converte i numeri in testo', () => {
    expect(toCsvField(5)).to.equal('5');
  });

  it('compone una riga separando i campi con la virgola', () => {
    expect(toCsvRow(['CHI-8', 'Chiodi, 8cm', 20, 50])).to.equal('CHI-8,"Chiodi, 8cm",20,50');
  });
});
