# Passo 6 – I cambi di comportamento voluti

**Tag:** `passo-6-cambio-voluto`

## Cosa succede
Le stranezze fotografate al passo 2 diventano comportamenti corretti. Ognuna è un **cambio voluto**: un test lo
dichiara prima, il codice segue, la fotografia si aggiorna di proposito.

| Prima | Dopo |
|---|---|
| totale `0.30000000000000004` | totale arrotondato ai centesimi: `0.3` |
| CSV rotto con `Chiodi, 8cm` | campi tra virgolette secondo l'RFC 4180: `"Chiodi, 8cm"` (i fine riga CRLF richiesti dall'RFC arrivano al passo 7) |
| quantità negativa: ordine creato, scorte **aumentate** | 400 `invalid items`, scorte intatte |
| ordine senza articoli: creato, totale 0 | 400 `invalid items` |
| `productId` non valido: 500 | 400 `invalid items` |
| ID non valido in `GET /orders/:id` e `PUT /products/:id`: 500 | 400 `invalid id` |
| ricerca con `(`: 500 | la ricerca è testo semplice, nessun risultato |

## In che ordine, e perché così
1. **Test unitari prima** (`test/unit/`): `toCsvField`/`toCsvRow` in `src/csv.js`, `isValidId`/`parseOrderItems` in
   `src/validation.js`. Rossi perché i moduli non esistevano, poi verdi.
2. **Attese esplicite nelle caratterizzazioni** dei comportamenti che cambiano (titolo `[cambiato al passo 6]`):
   8 test rossi, ognuno per il motivo atteso (`expected 0.30000000000000004 to equal 0.3`, `expected 201 to equal 400`…).
3. **Codice**: le attese esplicite diventano verdi; falliscono solo le fotografie vecchie o mancanti di quei test.
4. **Fotografie aggiornate solo lì**: `npm run test:update-golden -- --grep "cambiato al passo 6"`, poi diff riletto
   (4 fotografie modificate, 3 nuove, nessun'altra toccata).

## Scelte da saper spiegare
- **Arrotondamento alla fine, ai centesimi.** Il problema nasce dalla virgola mobile: `0.1` non si rappresenta esatto in
  binario. In un sistema contabile vero si lavorerebbe in centesimi interi; qui, per non cambiare il formato dei dati,
  si arrotonda il totale.
- **`isValidId` più severo del driver:** `ObjectId.isValid` accetta qualsiasi stringa di 12 caratteri. Qui un ID valido
  è solo di 24 caratteri esadecimali.
- **Quantità solo intere da 1 in su:** `"3"` come testo viene rifiutato. Meglio un 400 chiaro che una conversione
  silenziosa.
- **400 e non 500 per un input sbagliato:** il 500 dice "è colpa del server", il 400 dice al client cosa ha sbagliato.
- **Ricerca come testo:** con l'input usato come espressione regolare, `(` rompeva la richiesta e un'espressione
  costruita apposta avrebbe potuto rallentare il database (ReDoS).

## Come si verifica
```bash
npm test                                                          # 53 verdi
git diff passo-5-correzioni passo-6-cambio-voluto --stat -- test/golden   # 4 modificate, 3 nuove
npm run lint && npm run test:coverage                             # lint pulito, copertura 92% (al passo 6)
```

## Domande probabili in colloquio
- **"Come distingui un bug da un cambio voluto quando un test di caratterizzazione diventa rosso?"** Se l'ho deciso,
  prima scrivo l'attesa nuova nel test e la vedo fallire; poi cambio il codice e aggiorno solo quella fotografia. Un
  rosso che non ho previsto è una regressione.
- **"Perché `0.1 * 3` non fa `0.3`?"** Perché i numeri in virgola mobile sono in base 2 e `0.1` non ha una
  rappresentazione esatta. Per i soldi si usano interi in centesimi, o almeno si arrotonda in un punto preciso.
- **"Cosa dice l'RFC 4180?"** Che ogni riga termina con CRLF e che un campo con virgola, virgolette o a capo va tra virgolette, e le virgolette interne
  si raddoppiano.
- **"Perché validare prima di toccare il database?"** Per non scrivere dati incoerenti (scorte che salgono con un
  ordine) e per rispondere con un errore che il client capisce.
