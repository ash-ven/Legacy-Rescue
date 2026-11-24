const express = require('express');
const { HttpError, asyncHandler } = require('../errors');
const { listProducts, insertProduct, updateProduct } = require('../repositories/products');
const { isLowStock } = require('../services/stock');
const { isValidId, parseNewProduct, parseProductChanges } = require('../validation');

const DUPLICATE_KEY = 11000;

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
    const product = { ...parseNewProduct(req.body), tenantId: req.tenantId };
    try {
      res.status(201).json(await insertProduct(db, product));
    } catch (err) {
      if (err.code === DUPLICATE_KEY) {
        throw new HttpError(409, 'sku already exists');
      }
      throw err;
    }
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) {
      throw new HttpError(400, 'invalid id');
    }
    const product = await updateProduct(db, req.tenantId, req.params.id, parseProductChanges(req.body));
    if (!product) {
      throw new HttpError(404, 'product not found');
    }
    res.json(product);
  }));

  return router;
}

module.exports = { productsRouter };
