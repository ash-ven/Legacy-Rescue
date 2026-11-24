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

// Risposte d'errore sempre in JSON e senza dettagli interni:
// - errori previsti → il loro codice e messaggio;
// - corpo JSON malformato → 400 "invalid json";
// - altri errori della richiesta segnalati da Express (es. corpo troppo grande) → il loro codice;
// - tutto il resto → 500 "internal error"; il dettaglio va solo nel log del server.
// eslint-disable-next-line no-unused-vars -- Express riconosce il gestore dai 4 parametri
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid json' });
  }
  if (err.expose && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  return res.status(500).json({ error: 'internal error' });
}

module.exports = { HttpError, asyncHandler, errorHandler };
