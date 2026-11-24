const { HttpError, asyncHandler } = require('../errors');
const { findApiKey, findTenant } = require('../repositories/tenants');

// Identifica l'azienda dalla chiave nell'header x-api-key e la mette in req.tenant / req.tenantId.
function requireTenant(db) {
  return asyncHandler(async (req, res, next) => {
    const key = req.headers['x-api-key'];
    if (!key) {
      throw new HttpError(401, 'missing api key');
    }
    const apiKey = await findApiKey(db, key);
    if (!apiKey) {
      throw new HttpError(401, 'invalid api key');
    }
    req.tenant = await findTenant(db, apiKey.tenantId);
    req.tenantId = apiKey.tenantId;
    next();
  });
}

module.exports = { requireTenant };
