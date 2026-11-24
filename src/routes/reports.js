const express = require('express');
const { asyncHandler } = require('../errors');
const { toCsvRow } = require('../csv');
const { listProducts } = require('../repositories/products');
const { isLowStock } = require('../services/stock');

function reportsRouter(db) {
  const router = express.Router();

  router.get('/low-stock.csv', asyncHandler(async (req, res) => {
    const products = await listProducts(db, req.tenantId);
    // RFC 4180: ogni riga, intestazione compresa, termina con CRLF.
    const lines = [['sku', 'name', 'qty', 'minQty'], ...products.filter(isLowStock).map((p) => [p.sku, p.name, p.qty, p.minQty])];
    res.set('Content-Type', 'text/csv');
    res.send(lines.map((line) => `${toCsvRow(line)}\r\n`).join(''));
  }));

  return router;
}

module.exports = { reportsRouter };
