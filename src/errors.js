const { MongoError } = require('mongodb');

// Errore con un codice HTTP preciso (404, 400...), lanciato da servizi e rotte.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 non intercetta le promesse rifiutate: questo involucro le passa al gestore degli errori.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
}

// Stesso comportamento del legacy:
// - errori "previsti" → il loro codice con { error }
// - errori di MongoDB → 500 con { error: messaggio }
// - tutto il resto (ID non valido, ricerca non valida) → pagina d'errore 500 di Express
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof MongoError) {
    return res.status(500).json({ error: err.message });
  }
  return next(err);
}

module.exports = { HttpError, asyncHandler, errorHandler };
