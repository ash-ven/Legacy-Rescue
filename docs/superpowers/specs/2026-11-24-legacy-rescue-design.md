# legacy-rescue: design

*24/11/2026 · Asiha Venturi (revisione) · scritto con Claude Code*

## Perché
Nel CV la riga più forte è il lavoro sui test in tirocinio: test di caratterizzazione su codice legacy, test di
isolamento tra tenant, CI. Quel codice è del cliente e non si può mostrare. Questo progetto ripete **il metodo**
su un'applicazione inventata e pubblica, così chi legge il CV può verificarlo e in colloquio c'è qualcosa da aprire.

## Obiettivi
- Un repository pubblico su GitHub che racconta il salvataggio di un'API legacy in passi, **un commit e un tag per passo**.
- Ogni passo verificabile: si fa checkout del tag, si lancia `npm test`, si vede cosa è cambiato e perché.
- Una scheda per passo ("cosa, perché, come si verifica, domande da colloquio"), scritta perché Asiha
  sappia spiegare ogni scelta.

## Non obiettivi
- Non è un prodotto: niente interfaccia, niente deploy.
- Non copre tutto il mondo dei test: niente test end-to-end nel browser, niente test di carico.

## Cosa lo renderebbe un fallimento
- **Somiglianza con il lavoro del tirocinio:** codice, dominio, nomi o difetti. Il dominio è un magazzino,
  i difetti sono esempi da manuale (OWASP API Top 10).
- Una scelta che Asiha non sa spiegare.
- Test che passano "per caso": dipendenti dall'orario, dall'ordine, da servizi esterni.
- Segreti nel repository (anche finti ma realistici).

## Vincoli
- Node 22 (`.nvmrc`), Express, driver ufficiale MongoDB.
- Test: Mocha, Chai, Sinon, Supertest; database in memoria con `mongodb-memory-server` (nessun servizio esterno, gira uguale in CI).
- Copertura con `c8`; lint con ESLint 9; segreti controllati con gitleaks.
- CI su GitHub Actions.
- Autore dei commit: `Asiha Venturi <349882423+ash-ven@users.noreply.github.com>` (config locale del repo),
  con la riga `Co-Authored-By: Claude`: è il "metodo assistito da AI" dichiarato nel CV.
- **Claude non fa push** e non crea il repository su GitHub: lo pubblica Asiha.
- Dati solo inventati: aziende "Ferramenta Rossi" e "Ortofrutta Bianchi", chiavi `test-key-…` evidentemente finte.

## Strade considerate
- **Database:** MongoDB con database in memoria (**scelta**: è lo stack del CV, test veloci e isolati, CI senza servizi)
  · SQLite (più semplice, ma non è lo stack del CV) · file JSON (troppo finto per un "legacy" credibile).
- **Fotografia del comportamento (caratterizzazione):** piccolo helper "golden master" scritto a mano, risposte salvate in
  `test/golden/*.json` e riscritte solo con `UPDATE_GOLDEN=1` (**scelta**: si spiega in due righe e mostra di aver capito
  il concetto) · snapshot di Jest (richiede Jest, il CV dice Mocha).
- **Stile legacy:** un solo file con `var`, catene di `.then`, logica nelle rotte e controlli fatti a metà (**scelta**) ·
  callback del vecchio driver (servirebbe un driver vecchio e insicuro).

## L'applicazione legacy (passo 1)
API di magazzino multi-tenant. Ogni richiesta porta l'header `x-api-key`, che identifica l'azienda (tenant).

| Rotta | Cosa fa | Difetto seminato |
|---|---|---|
| `GET /products?search=&low_stock=1` | prodotti dell'azienda | — |
| `POST /products` | crea un prodotto (SKU unico per azienda) | — |
| `PUT /products/:id` | modifica un prodotto | **assegnazione di massa**: copia tutto il corpo, anche `tenantId` (si può "spostare" un prodotto a un'altra azienda) |
| `GET /orders` | ordini dell'azienda | — |
| `GET /orders/:id` | dettaglio ordine | **BOLA**: non controlla l'azienda, con l'ID giusto si legge l'ordine di un altro |
| `POST /orders` | crea un ordine: controlla e scala le scorte, calcola il totale, data di creazione, avvisa l'azienda con una chiamata HTTP | **stranezza**: totale in virgola mobile non arrotondato (es. `0.30000000000000004`) |
| `GET /reports/low-stock.csv` | CSV dei prodotti sotto scorta | **stranezza**: nomi con virgola non tra virgolette, il CSV si rompe |

## I passi (un commit e un tag ciascuno)
1. **`passo-1-legacy`** – il codice com'è, senza test; `docker compose` per avviarlo in locale.
2. **`passo-2-rete-di-test`** – Mocha/Chai/Supertest/Sinon, database in memoria, dati di due aziende, helper golden master,
   test di caratterizzazione per ogni rotta **compresi difetti e stranezze** (si fotografa ciò che fa, non ciò che dovrebbe fare);
   orologio finto e chiamata HTTP sostituita con Sinon; copertura con c8; CI (test + gitleaks) da qui in avanti.
3. **`passo-3-refactoring`** – rotte, servizi, repository, middleware dell'azienda, gestione errori unica, `async/await`;
   **nessun test di caratterizzazione cambia**; arriva ESLint, anche in CI.
4. **`passo-4-test-di-sicurezza-in-pausa`** – test di accettazione su isolamento tra aziende e assegnazione di massa,
   scritti come dovrebbe essere e messi **in pausa** (`it.skip` con il motivo) finché non arriva la correzione.
5. **`passo-5-correzioni`** – il filtro per azienda diventa obbligatorio nel repository, elenco dei campi modificabili;
   i test in pausa si attivano; le due fotografie che documentavano i difetti si aggiornano **di proposito**, e il commit lo dice.
6. **`passo-6-cambio-voluto`** – totale arrotondato ai centesimi e CSV con le virgolette: cambi di comportamento voluti,
   con fotografie aggiornate e differenza spiegata.

## Documentazione
- `README.md`: la storia in breve, tabella dei passi con link ai tag, come si esegue, distintivo della CI, riassunto in inglese.
- `docs/passi/0N-*.md`: per ogni passo cosa, perché, come si verifica, domande probabili in colloquio con risposta.
- `docs/colloquio.md`: le domande più probabili raccolte in un posto.

## Come si verifica ogni passo
`npm test` verde (con i test in pausa segnati come pending), copertura sopra la soglia dal passo 2, `npm run lint` dal passo 3,
`gitleaks detect` pulito sulla storia, `git log --oneline` che racconta i passi.

## Lasciato a chi costruisce
Nomi dei file interni, testo esatto dei messaggi d'errore, soglia di copertura (indicativamente 90%), dettagli del CSV.

## Possibili estensioni (non ora)
Passo sul test instabile (dati casuali che collidono e come si diagnostica), mutation testing, test di contratto con Postman.
