const { ObjectId } = require('mongodb');

const orders = (db) => db.collection('orders');

function listOrders(db, tenantId) {
  return orders(db).find({ tenantId }).sort({ _id: 1 }).toArray();
}

// Sempre filtrato per azienda: un ordine di un'altra azienda risulta inesistente.
function findOrderById(db, tenantId, id) {
  return orders(db).findOne({ _id: new ObjectId(id), tenantId });
}

// Il driver aggiunge _id all'oggetto inserito.
async function insertOrder(db, order) {
  await orders(db).insertOne(order);
  return order;
}

module.exports = { listOrders, findOrderById, insertOrder };
