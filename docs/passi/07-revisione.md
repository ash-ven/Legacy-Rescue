# Passo 7 – La revisione indipendente

**Tag:** `passo-7-revisione`

## Cosa succede
Finiti i sei passi, l'intero repository è stato riletto da un revisore indipendente (un agente nuovo, senza il
contesto di chi aveva scritto il codice). La revisione ha confermato che ogni passo fa ciò che dichiara e che i numeri
della documentazione sono giusti, e ha trovato quello che chi scrive non vede. Ogni problema è stato corretto con il suo
test, scritto prima e visto fallire (19 rossi, ognuno per il motivo atteso).

| Problema trovato | Cosa succedeva | Correzione |
|---|---|---|
| **Vendita oltre le scorte** | stesso prodotto due volte nello stesso ordine, oppure due ordini contemporanei sull'ultima merce: entrambi accettati, scorte sotto zero | scarico **condizionato e atomico** (`qty >= n` nella stessa operazione), compensazione se l'ordine non si completa, prodotti ripetuti rifiutati |
| **Mass assignment in creazione** | `POST /products` salvava tutto il corpo: il client poteva scegliere `_id` e campi a caso | elenco dei campi permessi anche in creazione (`parseNewProduct`) |
| **Tipi non validati** | `qty: "abc"` veniva salvato e poi ogni ordine di quel prodotto rispondeva 500 | prezzo ≥ 0, quantità intere ≥ 0, nomi non vuoti: altrimenti 400 `invalid product` |
| **Dettagli interni nelle risposte** | SKU doppio: 500 con il messaggio di MongoDB (database, collezione, indice); JSON malformato: pagina HTML con stack e percorsi del server | 409 `sku already exists`; 400 `invalid json`; ogni altro errore 500 `internal error`, dettagli solo nel log |
| **ID maiuscolo** | accettato come valido ma poi non trovato: 404 su un prodotto esistente | ID valido solo in minuscolo, come nel database: 400 |
| **CSV non del tutto RFC 4180** | righe terminate da `\n` | righe terminate da `\r\n` |
| **Documentazione** | comandi `git diff <tag>` che, lanciati dall'ultimo passo, non davano il risultato dichiarato | confronto sempre tra due tag |

Più alcune raccomandazioni applicate: versione di gitleaks fissata in CI, niente download di MongoDB nel job di lint,
test che usano gli stessi indici dell'applicazione (`ensureIndexes`).

## Le fotografie cambiate, di proposito
`products-crea-sku-doppio` (500 → 409), `products-crea-sku-altra-azienda` (prezzo 0 se manca), le due del CSV
(fine riga CRLF). Nessun'altra.

## Scelte da saper spiegare
- **Perché lo scarico condizionato e non "controlla e poi scala":** tra il controllo e la scrittura un'altra richiesta
  può prendere la stessa merce (*race condition*). Con `updateOne({ qty: { $gte: n } }, { $inc: { qty: -n } })` il
  controllo e la scrittura sono una sola operazione atomica: se le scorte non bastano più, non scala niente.
- **Compensazione invece di transazione:** se il secondo articolo non è disponibile, il primo viene rimesso a
  magazzino. In produzione si userebbe una transazione MongoDB, che però richiede un replica set; qui la compensazione
  tiene coerenti i dati senza cambiare infrastruttura. Il limite è dichiarato: un crash proprio a metà lascerebbe il
  magazzino da riallineare.
- **Errori senza dettagli interni:** un messaggio di MongoDB o uno stack con i percorsi aiutano chi attacca a capire
  com'è fatto il sistema. Al client va un messaggio generico, a chi gestisce il server il log completo.

## Come si verifica
```bash
npm test                     # 70 verdi
npm run test:coverage        # 91% delle righe
git diff passo-6-cambio-voluto passo-7-revisione --stat -- test/golden   # le 4 fotografie sopra
```

## Domande probabili in colloquio
- **"Cos'è una race condition e come l'hai trovata?"** Due richieste che leggono lo stesso dato e poi scrivono, ognuna
  convinta di essere sola. L'ha trovata la revisione; l'ho riprodotta con un test che lancia due ordini insieme
  (prima passavano entrambi) e l'ho corretta con uno scarico atomico.
- **"Perché una revisione indipendente se avevi già i test?"** I test controllano ciò a cui ho pensato; chi rilegge
  senza il mio contesto trova ciò a cui non ho pensato. Qui ha trovato una vendita oltre le scorte e un mass assignment
  in creazione, lo stesso difetto corretto al passo 5 ma in un'altra rotta.
- **"Perché 409 per lo SKU doppio?"** È un conflitto con lo stato attuale della risorsa, non un errore del server.
- **"Transazione o compensazione?"** La transazione è la scelta giusta quando l'infrastruttura la supporta; la
  compensazione è un compromesso esplicito, con un limite che va dichiarato.
