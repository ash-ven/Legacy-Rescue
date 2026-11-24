// Indici del database: lo SKU è unico all'interno di ogni azienda.
async function ensureIndexes(db) {
  await db.collection('products').createIndex({ tenantId: 1, sku: 1 }, { unique: true });
}

module.exports = { ensureIndexes };
