const { HttpError } = require('./errors');

// 24 caratteri esadecimali minuscoli, come li scrive il database. Più severo di ObjectId.isValid,
// che accetta anche qualsiasi stringa di 12 caratteri.
const isValidId = (id) => typeof id === 'string' && /^[0-9a-f]{24}$/.test(id);

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isAmount = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isCount = (value) => Number.isInteger(value) && value >= 0;

// Un ordine ha almeno un articolo; ogni articolo ha un productId valido, non ripetuto,
// e una quantità intera da 1 in su.
function parseOrderItems(items) {
  const valid =
    Array.isArray(items) &&
    items.length > 0 &&
    items.every((item) => item && isValidId(item.productId) && Number.isInteger(item.qty) && item.qty >= 1) &&
    new Set(items.map((item) => item.productId)).size === items.length;
  if (!valid) {
    throw new HttpError(400, 'invalid items');
  }
  return items.map(({ productId, qty }) => ({ productId, qty }));
}

// Regole dei campi di un prodotto: è anche l'elenco dei campi che il client può inviare.
const PRODUCT_FIELDS = { sku: isText, name: isText, price: isAmount, qty: isCount, minQty: isCount };
const EDITABLE_FIELDS = ['name', 'price', 'qty', 'minQty'];

function pickValid(body, fields) {
  const picked = {};
  for (const field of fields) {
    if (body[field] === undefined) continue;
    if (!PRODUCT_FIELDS[field](body[field])) {
      throw new HttpError(400, 'invalid product');
    }
    picked[field] = body[field];
  }
  return picked;
}

// Nuovo prodotto: solo i campi previsti (niente _id né tenantId dal client), prezzo e quantità a 0 se mancano.
function parseNewProduct(body = {}) {
  if (!body.sku || !body.name) {
    throw new HttpError(400, 'sku and name are required');
  }
  return { price: 0, qty: 0, minQty: 0, ...pickValid(body, Object.keys(PRODUCT_FIELDS)) };
}

// Modifica: solo i campi modificabili, validati; gli altri vengono ignorati.
function parseProductChanges(body = {}) {
  return pickValid(body, EDITABLE_FIELDS);
}

module.exports = { isValidId, parseOrderItems, parseNewProduct, parseProductChanges };
