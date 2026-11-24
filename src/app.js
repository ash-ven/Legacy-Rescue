const express = require('express');
const { errorHandler } = require('./errors');
const { requireTenant } = require('./middleware/tenant');
const { productsRouter } = require('./routes/products');
const { ordersRouter } = require('./routes/orders');
const { reportsRouter } = require('./routes/reports');

// Costruisce l'app con il database ricevuto: nessuna connessione, nessuno stato globale.
function createApp({ db }) {
  const app = express();
  app.use(express.json());
  app.use(requireTenant(db));
  app.use('/products', productsRouter(db));
  app.use('/orders', ordersRouter(db));
  app.use('/reports', reportsRouter(db));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
