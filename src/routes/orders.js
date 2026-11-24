const express = require('express');
const { HttpError, asyncHandler } = require('../errors');
const { listOrders, findOrderById } = require('../repositories/orders');
const { createOrder } = require('../services/orders');

function ordersRouter(db) {
  const router = express.Router();

  router.get('/', asyncHandler(async (req, res) => {
    res.json(await listOrders(db, req.tenantId));
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const order = await findOrderById(db, req.tenantId, req.params.id);
    if (!order) {
      throw new HttpError(404, 'order not found');
    }
    res.json(order);
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const order = await createOrder(db, req.tenant, req.body.items || []);
    res.status(201).json(order);
  }));

  return router;
}

module.exports = { ordersRouter };
