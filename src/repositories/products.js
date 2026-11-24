const { ObjectId } = require('mongodb');

const products = (db) => db.collection('products');

// La ricerca è testo semplice: i caratteri speciali delle espressioni regolari non hanno effetto.
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function listProducts(db, tenantId, { search } = {}) {
  const query = { tenantId };
  if (search) {
    query.name = new RegExp(escapeRegExp(String(search)), 'i');
  }
  return products(db).find(query).sort({ sku: 1 }).toArray();
}

// Il driver aggiunge _id all'oggetto inserito.
async function insertProduct(db, product) {
  await products(db).insertOne(product);
  return product;
}

// Applica le modifiche già validate (vedi parseProductChanges). Sempre filtrato per azienda.
function updateProduct(db, tenantId, id, changes) {
  const filter = { _id: new ObjectId(id), tenantId };
  if (Object.keys(changes).length === 0) {
    return products(db).findOne(filter);
  }
  return products(db).findOneAndUpdate(filter, { $set: changes }, { returnDocument: 'after' });
}

// Sempre filtrato per azienda: un prodotto di un'altra azienda risulta inesistente.
function findProductsByIds(db, tenantId, ids) {
  return products(db).find({ _id: { $in: ids }, tenantId }).toArray();
}

// Scala le scorte solo se bastano, in un'unica operazione atomica: due ordini contemporanei
// non possono vendere la stessa merce. Restituisce false se le scorte non bastano più.
async function decrementStock(db, tenantId, productId, qty) {
  const result = await products(db).updateOne(
    { _id: productId, tenantId, qty: { $gte: qty } },
    { $inc: { qty: -qty } }
  );
  return result.matchedCount === 1;
}

// Rimette le scorte (compensazione quando un ordine non va a buon fine).
function incrementStock(db, tenantId, productId, qty) {
  return products(db).updateOne({ _id: productId, tenantId }, { $inc: { qty } });
}

module.exports = { listProducts, insertProduct, updateProduct, findProductsByIds, decrementStock, incrementStock };
