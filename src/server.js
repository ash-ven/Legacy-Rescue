// Avvio dell'API: connessione a MongoDB, indici, server HTTP. Tutta la logica è in app.js e nelle sue cartelle.
const { MongoClient } = require('mongodb');
const { createApp } = require('./app');
const { ensureIndexes } = require('./db');

async function start() {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/legacy-rescue';
  const port = process.env.PORT || 3000;
  const client = await MongoClient.connect(url);
  const db = client.db();
  await ensureIndexes(db);
  createApp({ db }).listen(port, () => {
    console.log(`Magazzino API in ascolto sulla porta ${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { start };
