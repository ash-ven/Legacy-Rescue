function findApiKey(db, key) {
  return db.collection('apikeys').findOne({ key });
}

function findTenant(db, tenantId) {
  return db.collection('tenants').findOne({ _id: tenantId });
}

module.exports = { findApiKey, findTenant };
