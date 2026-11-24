const { ObjectId } = require('mongodb');
const { HttpError } = require('../errors');
const { notifyTenant } = require('../notify');
const { findProductsByIds, incrementStock } = require('../repositories/products');
const { insertOrder } = require('../repositories/orders');

// Crea un ordine: controlla le scorte, calcola il totale, scala le scorte, salva e avvisa l'azienda.
// Stesso comportamento del legacy, stranezze comprese (totale non arrotondato, quantità non validate).
async function createOrder(db, tenant, items) {
  const ids = items.map((item) => new ObjectId(item.productId));
  const products = await findProductsByIds(db, ids);

  const order = { tenantId: tenant._id, items: [], total: 0, createdAt: new Date() };
  for (const item of items) {
    const product = products.find((p) => p._id.toString() === String(item.productId));
    if (!product) {
      throw new HttpError(404, 'product not found');
    }
    if (product.qty < item.qty) {
      throw new HttpError(400, `not enough stock for ${product.sku}`);
    }
    order.items.push({ productId: product._id, sku: product.sku, qty: item.qty, price: product.price });
    order.total += product.price * item.qty;
  }

  await Promise.all(order.items.map((it) => incrementStock(db, it.productId, -it.qty)));
  await insertOrder(db, order);
  notifyTenant(tenant, { event: 'order.created', orderId: order._id });
  return order;
}

module.exports = { createOrder };
