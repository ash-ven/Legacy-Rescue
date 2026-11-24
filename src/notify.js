// Avvisa l'azienda con una POST al suo webhook. Non si aspetta la risposta e un errore non blocca niente
// (stesso comportamento del legacy: "se va male, pazienza").
function notifyTenant(tenant, event) {
  fetch(tenant.webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => {});
}

module.exports = { notifyTenant };
