const { HttpError } = require('./errors');

// Più severo di ObjectId.isValid, che accetta anche qualsiasi stringa di 12 caratteri.
const isValidId = (id) => typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id);

// Un ordine ha almeno un articolo; ogni articolo ha un productId valido e una quantità intera da 1 in su.
function parseOrderItems(items) {
  const valid =
    Array.isArray(items) &&
    items.length > 0 &&
    items.every((item) => item && isValidId(item.productId) && Number.isInteger(item.qty) && item.qty >= 1);
  if (!valid) {
    throw new HttpError(400, 'invalid items');
  }
  return items.map(({ productId, qty }) => ({ productId, qty }));
}

module.exports = { isValidId, parseOrderItems };
