// Dati dei test: due aziende inventate. Ogni test parte da qui.
export const KEYS = { rossi: 'test-key-rossi', bianchi: 'test-key-bianchi' };

export async function seed(db) {
  await db.collection('tenants').insertMany([
    { _id: 'rossi', name: 'Ferramenta Rossi', webhookUrl: 'https://example.test/hooks/rossi' },
    { _id: 'bianchi', name: 'Ortofrutta Bianchi', webhookUrl: 'https://example.test/hooks/bianchi' },
  ]);
  await db.collection('apikeys').insertMany([
    { key: KEYS.rossi, tenantId: 'rossi' },
    { key: KEYS.bianchi, tenantId: 'bianchi' },
  ]);
  const { insertedIds } = await db.collection('products').insertMany([
    { tenantId: 'rossi', sku: 'VIT-4', name: 'Viti, 4mm', price: 0.1, qty: 100, minQty: 10 },
    { tenantId: 'rossi', sku: 'MAR-1', name: 'Martello', price: 12.5, qty: 3, minQty: 5 },
    { tenantId: 'rossi', sku: 'CHI-8', name: 'Chiodi, 8cm', price: 0.05, qty: 20, minQty: 50 },
    { tenantId: 'bianchi', sku: 'MEL-1', name: 'Mele', price: 2.2, qty: 50, minQty: 10 },
  ]);
  return {
    viti: insertedIds[0].toString(),
    martello: insertedIds[1].toString(),
    chiodi: insertedIds[2].toString(),
    mele: insertedIds[3].toString(),
  };
}
