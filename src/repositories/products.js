const { ObjectId } = require('mongodb');

const products = (db) => db.collection('products');

function listProducts(db, tenantId, { search } = {}) {
  const query = { tenantId };
  if (search) {
    query.name = new RegExp(search, 'i');
  }
  return products(db).find(query).sort({ sku: 1 }).toArray();
}

// Il driver aggiunge _id all'oggetto inserito.
async function insertProduct(db, product) {
  await products(db).insertOne(product);
  return product;
}

// NB (comportamento legacy, fotografato al passo 2): applica tutti i campi ricevuti, tenantId compreso.
function updateProduct(db, tenantId, id, changes) {
  return products(db).findOneAndUpdate(
    { _id: new ObjectId(id), tenantId },
    { $set: changes },
    { returnDocument: 'after' }
  );
}

// NB (comportamento legacy, fotografato al passo 2): cerca per _id senza filtrare per azienda.
function findProductsByIds(db, ids) {
  return products(db).find({ _id: { $in: ids } }).toArray();
}

function incrementStock(db, productId, delta) {
  return products(db).updateOne({ _id: productId }, { $inc: { qty: delta } });
}

module.exports = { listProducts, insertProduct, updateProduct, findProductsByIds, incrementStock };
