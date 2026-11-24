const express = require('express');
const { asyncHandler } = require('../errors');
const { toCsvRow } = require('../csv');
const { listProducts } = require('../repositories/products');
const { isLowStock } = require('../services/stock');

function reportsRouter(db) {
  const router = express.Router();

  router.get('/low-stock.csv', asyncHandler(async (req, res) => {
    const products = await listProducts(db, req.tenantId);
    const rows = products
      .filter(isLowStock)
      .map((p) => `${toCsvRow([p.sku, p.name, p.qty, p.minQty])}\n`);
    res.set('Content-Type', 'text/csv');
    res.send(`sku,name,qty,minQty\n${rows.join('')}`);
  }));

  return router;
}

module.exports = { reportsRouter };
