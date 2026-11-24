# Passo 3 – Il refactoring

**Tag:** `passo-3-refactoring`

## Cosa succede
Il file unico diventa una struttura a strati, **senza cambiare nessun comportamento**, difetti compresi:

```
src/
  server.js            solo l'avvio: connessione, indici, porta
  app.js               createApp({ db }): monta middleware e rotte
  errors.js            HttpError, asyncHandler, gestore degli errori
  notify.js            avviso all'azienda via webhook
  db.js                indici
  middleware/tenant.js chi sei, dalla chiave x-api-key
  routes/              HTTP: legge la richiesta, chiama, risponde
  services/            regole: creazione ordini, "sotto scorta"
  repositories/        le query a MongoDB
```

## La prova che il comportamento non è cambiato
- I 30 test di caratterizzazione e le 25 fotografie **non sono stati toccati**:
  `git diff passo-2-rete-di-test passo-3-refactoring -- test/characterization test/golden` è vuoto.
- L'unico file di test cambiato è `test/support/app.mjs`, l'adattatore che costruisce l'app: prima usava la cucitura
  del legacy (`setDb`), ora usa `createApp({ db })`. È stato pensato apposta al passo 2 per isolare questo cambio.
- **Controprova:** cambiando di nascosto il messaggio `missing api key` il test dell'autenticazione diventa rosso e
  mostra la differenza; rimesso a posto, torna verde. La rete se ne accorge.

## Scelte da saper spiegare
- **I difetti restano, segnati con `NB`** nei repository (`findOrderById` non filtra per azienda, `updateProduct`
  applica tutti i campi). Correggerli qui mescolerebbe due cose: un refactoring si verifica con "i test non cambiano",
  una correzione con "un test cambia di proposito". Insieme non si verifica più nessuna delle due.
- **`asyncHandler`:** Express 4 non intercetta le promesse rifiutate. Senza l'involucro, un errore in una rotta
  `async` lascerebbe la richiesta appesa.
- **Il gestore degli errori riproduce il legacy:** errori previsti → il loro codice; errori di MongoDB → 500 con il
  messaggio; il resto (ID non valido, ricerca con `(`) → la pagina d'errore 500 di Express, come prima.
- **`db` passato come parametro** invece che globale: l'app si costruisce con qualsiasi database, ed è per questo che
  i test non hanno più bisogno della cucitura.
- **ESLint** entra adesso, anche in CI: sul codice legacy avrebbe dato solo rumore.
- **Copertura:** con l'avvio separato in `server.js` sale al 91%; la soglia passa dall'85% al 90%.

## Come si verifica
```bash
git diff passo-2-rete-di-test passo-3-refactoring -- test/characterization test/golden   # vuoto
npm test && npm run lint && npm run test:coverage
```

## Domande probabili in colloquio
- **"Come sai che il refactoring non ha rotto niente?"** Perché i test di caratterizzazione sono gli stessi di prima e
  sono verdi; e ho verificato che la rete fallisce davvero se cambio un comportamento.
- **"Perché non hai corretto i difetti mentre c'eri?"** Perché un refactoring e una correzione si verificano in modi
  opposti: nel primo i test non devono cambiare, nella seconda uno deve cambiare di proposito. Tenendoli separati, ogni
  commit è verificabile da solo.
- **"Perché routes, services e repositories?"** Per separare HTTP, regole e accesso ai dati: il filtro per azienda, per
  esempio, adesso sta in un solo posto, il repository, ed è lì che lo correggerò.
- **"Cos'è `asyncHandler`?"** Un involucro che passa a Express gli errori delle funzioni `async`: Express 4 non lo fa da solo.
