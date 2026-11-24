const { ObjectId } = require('mongodb');
const { HttpError } = require('../errors');
const { notifyTenant } = require('../notify');
const { parseOrderItems } = require('../validation');
const { findProductsByIds, decrementStock, incrementStock } = require('../repositories/products');
const { insertOrder } = require('../repositories/orders');

const roundToCents = (amount) => Math.round(amount * 100) / 100;

// Rimette le scorte già scalate: senza transazioni (servirebbe un replica set) è la compensazione
// che tiene coerente il magazzino se l'ordine non si completa.
const restock = (db, tenantId, items) =>
  Promise.all(items.map((it) => incrementStock(db, tenantId, it.productId, it.qty)));

// Crea un ordine: valida gli articoli, controlla le scorte, calcola il totale (in centesimi), scala le scorte,
// salva e avvisa l'azienda. I prodotti si cercano solo tra quelli dell'azienda.
async function createOrder(db, tenant, rawItems) {
  const items = parseOrderItems(rawItems);
  const ids = items.map((item) => new ObjectId(item.productId));
  const products = await findProductsByIds(db, tenant._id, ids);

  const order = { tenantId: tenant._id, items: [], total: 0, createdAt: new Date() };
  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product) {
      throw new HttpError(404, 'product not found');
    }
    if (product.qty < item.qty) {
      throw new HttpError(400, `not enough stock for ${product.sku}`);
    }
    order.items.push({ productId: product._id, sku: product.sku, qty: item.qty, price: product.price });
    order.total += product.price * item.qty;
  }
  order.total = roundToCents(order.total);

  // Il controllo sopra risponde subito nei casi semplici; quello che conta è lo scarico condizionato,
  // che resta corretto anche se un altro ordine ha preso la merce nel frattempo.
  const taken = [];
  for (const it of order.items) {
    if (!(await decrementStock(db, tenant._id, it.productId, it.qty))) {
      await restock(db, tenant._id, taken);
      throw new HttpError(400, `not enough stock for ${it.sku}`);
    }
    taken.push(it);
  }

  try {
    await insertOrder(db, order);
  } catch (err) {
    await restock(db, tenant._id, taken);
    throw err;
  }
  notifyTenant(tenant, { event: 'order.created', orderId: order._id });
  return order;
}

module.exports = { createOrder };
