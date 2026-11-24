const express = require('express');
const { HttpError, asyncHandler } = require('../errors');
const { listProducts, insertProduct, updateProduct } = require('../repositories/products');
const { isLowStock } = require('../services/stock');

function productsRouter(db) {
  const router = express.Router();

  router.get('/', asyncHandler(async (req, res) => {
    let products = await listProducts(db, req.tenantId, { search: req.query.search });
    if (req.query.low_stock === '1') {
      products = products.filter(isLowStock);
    }
    res.json(products);
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const product = req.body;
    if (!product.sku || !product.name) {
      throw new HttpError(400, 'sku and name are required');
    }
    product.tenantId = req.tenantId;
    product.qty ??= 0;
    product.minQty ??= 0;
    res.status(201).json(await insertProduct(db, product));
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    const product = await updateProduct(db, req.tenantId, req.params.id, req.body);
    if (!product) {
      throw new HttpError(404, 'product not found');
    }
    res.json(product);
  }));

  return router;
}

module.exports = { productsRouter };
