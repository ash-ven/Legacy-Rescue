# Passo 2 – La rete di test

**Tag:** `passo-2-rete-di-test`

## Cosa succede
Prima di cambiare il codice si scrive una rete di **test di caratterizzazione**: test che descrivono cosa fa l'API
**oggi**, difetti compresi. Non dicono se il comportamento è giusto: dicono se è cambiato.

30 test su tutte le rotte. Quelli che fotografano qualcosa di sbagliato hanno il titolo che lo dichiara:
- **[difetto]** `PUT /products/:id` accetta `tenantId` nel corpo e "sposta" un prodotto a un'altra azienda;
- **[difetto]** `GET /orders/:id` mostra l'ordine di un'altra azienda a chi conosce l'ID;
- **[difetto]** un ordine può usare i prodotti di un'altra azienda, e ne scala le scorte;
- **[stranezza]** totale `0.30000000000000004` per 3 viti da 0,10;
- **[stranezza]** quantità negativa che *aumenta* le scorte, ordine vuoto da 0;
- **[stranezza]** CSV rotto quando il nome contiene una virgola;
- un ID scritto male o una ricerca con `(` fanno rispondere 500.

Per ora **restano così**: correggerli adesso vorrebbe dire cambiare comportamento senza una rete sotto.

## Gli strumenti, e perché
- **Mocha + Chai + Supertest:** Supertest chiama l'app Express senza aprire una porta vera.
- **MongoDB in memoria** (`mongodb-memory-server`): ogni test parte da un database pulito con due aziende inventate;
  nessun servizio esterno, gira uguale in locale e in CI.
- **Golden master** (`test/support/golden.mjs`): la risposta (stato, tipo, corpo) viene salvata in `test/golden/*.json`
  e confrontata a ogni esecuzione. Gli ObjectId cambiano sempre, quindi diventano `<id-1>`, `<id-2>`… Se la fotografia
  manca il test **fallisce**: si crea solo di proposito con `npm run test:update-golden`, e poi la si rilegge.
- **Sinon:**
  - **orologio finto** (solo `Date`) fermo al 24/11/2026 alle 9:00, così la data degli ordini è sempre la stessa;
  - **`fetch` sostituito**: nessuna chiamata vera ai webhook delle aziende, e si può controllare che sia partita
    (URL, metodo, corpo) o simulare che fallisca.
- **c8** per la copertura (soglia 85% delle righe) e **gitleaks** per i segreti, entrambi in CI.

## L'unica modifica al codice: la "cucitura"
Il legacy si connetteva al database appena caricato, quindi non si poteva testare. Al fondo di `src/server.js`:
- l'avvio parte solo se il file viene eseguito (`require.main === module`);
- il file esporta `app` e `setDb(db)`, così i test passano il loro database.

È la modifica più piccola possibile per rendere il codice testabile, e non cambia nessun comportamento.

## Due decisioni da conoscere
- **Soglia di copertura all'85%, non al 90%:** restano scoperte solo le righe di avvio e i rami "database in errore",
  raggiungibili soltanto con un guasto vero. Scrivere test artificiali per arrivare al 90% non avrebbe aggiunto sicurezza.
- **Eccezione di gitleaks** (`.gitleaks.toml`): le chiavi finte `test-key-rossi` e `test-key-bianchi` negli esempi
  `curl` venivano segnalate. L'eccezione vale solo per quelle due; qualsiasi altra chiave è ancora bloccata
  (verificato con una chiave diversa).

## Come si verifica
```bash
npm test                  # 30 test verdi
npm run test:coverage     # copertura sopra l'85%
```
Per vedere la rete funzionare: cambia il messaggio `'missing api key'` (al passo 2 è in `src/server.js`, dal passo 3 in `src/middleware/tenant.js`) e rilancia `npm test`. Il test
dell'autenticazione diventa rosso e mostra la differenza.

## Domande probabili in colloquio
- **"Che differenza c'è tra un test di caratterizzazione e un test normale?"** Un test normale verifica il comportamento
  *atteso*; uno di caratterizzazione registra quello *attuale*, anche se sbagliato. Serve a cambiare il codice sapendo
  subito se ho cambiato anche il comportamento.
- **"Perché fotografi un difetto invece di correggerlo subito?"** Perché correggerlo è un cambio di comportamento e va
  fatto di proposito, in un passo suo, con un test che lo dichiara. Prima mi serve la rete.
- **"Come gestisci dati che cambiano a ogni esecuzione, come ID e date?"** Gli ID li normalizzo nel confronto, la data
  la fermo con un orologio finto. Un test che dipende dall'ora è un test instabile.
- **"Perché sostituisci `fetch`?"** Un test non deve dipendere da un servizio esterno, né lo deve chiamare davvero. Con
  lo stub controllo che la chiamata parta con i dati giusti e posso simulare che fallisca.
- **"Hai dovuto modificare il codice per testarlo?"** Il minimo: una cucitura che separa l'avvio dall'app. È la tecnica
  classica dei libri sul codice legacy: la modifica più piccola e sicura che rende il codice testabile.
