const { ObjectId } = require('mongodb');

const orders = (db) => db.collection('orders');

function listOrders(db, tenantId) {
  return orders(db).find({ tenantId }).sort({ _id: 1 }).toArray();
}

// NB (comportamento legacy, fotografato al passo 2): cerca per _id senza filtrare per azienda.
function findOrderById(db, id) {
  return orders(db).findOne({ _id: new ObjectId(id) });
}

// Il driver aggiunge _id all'oggetto inserito.
async function insertOrder(db, order) {
  await orders(db).insertOne(order);
  return order;
}

module.exports = { listOrders, findOrderById, insertOrder };
