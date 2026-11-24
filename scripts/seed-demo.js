// Dati di prova per provare l'API in locale. Tutto inventato.
var MongoClient = require('mongodb').MongoClient;

var url = process.env.MONGO_URL || 'mongodb://localhost:27017/legacy-rescue';

MongoClient.connect(url).then(function (client) {
  var db = client.db();
  return db.dropDatabase().then(function () {
    return db.collection('tenants').insertMany([
      { _id: 'rossi', name: 'Ferramenta Rossi', webhookUrl: 'https://example.test/hooks/rossi' },
      { _id: 'bianchi', name: 'Ortofrutta Bianchi', webhookUrl: 'https://example.test/hooks/bianchi' }
    ]);
  }).then(function () {
    return db.collection('apikeys').insertMany([
      { key: 'test-key-rossi', tenantId: 'rossi' },
      { key: 'test-key-bianchi', tenantId: 'bianchi' }
    ]);
  }).then(function () {
    return db.collection('products').insertMany([
      { tenantId: 'rossi', sku: 'VIT-4', name: 'Viti, 4mm', price: 0.1, qty: 100, minQty: 10 },
      { tenantId: 'rossi', sku: 'MAR-1', name: 'Martello', price: 12.5, qty: 3, minQty: 5 },
      { tenantId: 'rossi', sku: 'CHI-8', name: 'Chiodi, 8cm', price: 0.05, qty: 20, minQty: 50 },
      { tenantId: 'bianchi', sku: 'MEL-1', name: 'Mele', price: 2.2, qty: 50, minQty: 10 }
    ]);
  }).then(function () {
    console.log('Dati di prova caricati');
    return client.close();
  });
});
