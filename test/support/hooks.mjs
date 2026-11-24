// Hook globali di Mocha: un MongoDB in memoria per tutta la suite, dati puliti prima di ogni test,
// orologio fermo e chiamate HTTP verso l'esterno sostituite.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import sinon from 'sinon';
import { seed } from './fixtures.mjs';

// In ambiente "test" Express non stampa lo stack degli errori 500 sul terminale.
process.env.NODE_ENV ??= 'test';

export const CLOCK = new Date('2026-11-24T09:00:00.000Z');

let mongod;
let client;
let db;

// ID dei prodotti di prova, rigenerati a ogni test (binding "vivo": chi lo importa vede sempre quelli attuali).
export let ids;

export function getDb() {
  return db;
}

export const mochaHooks = {
  async beforeAll() {
    this.timeout(180000); // la prima volta scarica MongoDB
    mongod = await MongoMemoryServer.create();
    client = await MongoClient.connect(mongod.getUri());
    db = client.db('legacy-rescue-test');
  },

  async beforeEach() {
    await db.dropDatabase();
    await db.collection('products').createIndex({ tenantId: 1, sku: 1 }, { unique: true });
    ids = await seed(db);
    // Nessuna chiamata vera verso i webhook delle aziende.
    sinon.stub(globalThis, 'fetch').resolves(new Response(null, { status: 204 }));
    // Solo Date è finto: timer e driver di MongoDB funzionano normalmente.
    sinon.useFakeTimers({ now: CLOCK, toFake: ['Date'] });
  },

  afterEach() {
    sinon.restore();
  },

  async afterAll() {
    await client?.close();
    await mongod?.stop();
  },
};
