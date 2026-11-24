# Passo 1 – Il codice com'è

**Tag:** `passo-1-legacy`

## Cosa c'è
Un'API di magazzino per più aziende, tutta in `src/server.js`: autenticazione, prodotti, ordini, report e avvio nello
stesso file. Nessun test.

## Cosa salta all'occhio (senza ancora toccare niente)
- **Un solo file** che fa tutto: per cambiare il calcolo del totale bisogna leggere anche l'autenticazione.
- **`db` globale**, valorizzato all'avvio: non si può creare l'app senza connettersi al database vero.
- **Logica nelle rotte**: controlli, calcoli e scritture sul database sono mescolati nello stesso blocco.
- **Errori gestiti a metà**: alcuni finiscono in un `.catch`, altri (per esempio un ID scritto male) fanno esplodere la
  rotta; la chiamata all'azienda dopo un ordine ignora qualsiasi errore.
- **Controlli sull'azienda non uniformi**: alcune query filtrano per `tenantId`, altre no. Non è ancora chiaro se sia un
  problema: lo diranno i test.

## Perché non si riscrive da zero
Perché non sappiamo con precisione **cosa fa**. Chi usa l'API dipende anche dai suoi difetti (un formato strano, un
codice di stato inatteso). Riscrivere senza una fotografia del comportamento attuale vuol dire rompere qualcosa che
qualcuno usa, senza accorgersene.

La regola del salvataggio: **prima i test che descrivono cosa succede oggi, poi le modifiche**.

## Come si verifica
```bash
docker compose up -d && npm run seed && npm start
curl http://localhost:3000/products                                  # 401 {"error":"missing api key"}
curl -H "x-api-key: test-key-rossi" http://localhost:3000/reports/low-stock.csv
```
Nel CSV la riga dei "Chiodi, 8cm" ha una colonna in più: è il primo comportamento strano, e per ora **resta così**.

## Domande probabili in colloquio
- **"Ti danno un codice legacy senza test: da dove parti?"** Dal capire cosa fa, non da cosa dovrebbe fare: leggo le
  rotte, lo avvio, e scrivo test che fotografano il comportamento attuale prima di cambiare una riga.
- **"Perché non lo riscrivi?"** Perché una riscrittura perde i comportamenti che nessuno ha documentato ma che qualcuno
  usa. Con i test di caratterizzazione posso migliorarlo a piccoli passi senza rompere chi lo usa.
- **"Cosa ti preoccupa di più in questo file?"** I filtri per azienda scritti a mano in ogni query: in un sistema
  multi-tenant basta dimenticarne uno per mostrare i dati di un cliente a un altro.
