const { ObjectId } = require('mongodb');

const products = (db) => db.collection('products');

// Gli unici campi che una modifica può toccare: tenantId, _id e sku restano fuori.
const EDITABLE_FIELDS = ['name', 'price', 'qty', 'minQty'];

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

// Applica solo i campi modificabili; gli altri vengono ignorati. Sempre filtrato per azienda.
function updateProduct(db, tenantId, id, changes) {
  const filter = { _id: new ObjectId(id), tenantId };
  const allowed = Object.fromEntries(
    Object.entries(changes).filter(([field]) => EDITABLE_FIELDS.includes(field))
  );
  if (Object.keys(allowed).length === 0) {
    return products(db).findOne(filter);
  }
  return products(db).findOneAndUpdate(filter, { $set: allowed }, { returnDocument: 'after' });
}

// Sempre filtrato per azienda: un prodotto di un'altra azienda risulta inesistente.
function findProductsByIds(db, tenantId, ids) {
  return products(db).find({ _id: { $in: ids }, tenantId }).toArray();
}

function incrementStock(db, productId, delta) {
  return products(db).updateOne({ _id: productId }, { $inc: { qty: delta } });
}

module.exports = { EDITABLE_FIELDS, listProducts, insertProduct, updateProduct, findProductsByIds, incrementStock };
