# legacy-rescue

[![CI](https://github.com/ash-ven/legacy-rescue/actions/workflows/ci.yml/badge.svg)](https://github.com/ash-ven/legacy-rescue/actions/workflows/ci.yml)

Caso di studio: come si mette in sicurezza un'API legacy **senza riscriverla da zero**. Prima se ne fotografa il
comportamento con i test, poi la si riorganizza, poi si correggono le vulnerabilità, un passo alla volta. Ogni passo è
un commit con un tag: si può leggere, eseguire e confrontare con il precedente.

L'applicazione è un'API di magazzino **multi-tenant**: un solo servizio e un solo database condivisi da più aziende
clienti, ognuna delle quali deve vedere solo i propri dati. Le aziende (Ferramenta Rossi e Ortofrutta Bianchi) e i dati
sono inventati. Il codice di partenza contiene **debito tecnico e vulnerabilità introdotti di proposito**, tipici dei
sistemi legacy reali.

> **In English.** A case study in rescuing a legacy multi-tenant Node.js/Express/MongoDB API without rewriting it. The
> starting code is deliberately seeded with technical debt and vulnerabilities. Characterization tests with golden
> masters pin the legacy behaviour (defects included); a refactor into routes/services/repositories keeps every test
> untouched; tenant-isolation acceptance tests (BOLA, mass assignment) stay pending until the fix; intentional behaviour
> changes are made test-first; a final independent review found a stock race condition, fixed test-first. One commit
> and one tag per step; CI runs tests with coverage, ESLint and gitleaks. Docs are in Italian.

## Come si usa

Non è un'applicazione da usare, ma un percorso da seguire. Si può esplorare a tre livelli.

**1. Leggerlo qui su GitHub (nessuna installazione).** Nella tabella dei passi, la *scheda* spiega cosa è successo e
perché, con le domande più probabili in colloquio; il link *differenze* mostra esattamente cosa è cambiato rispetto al
passo precedente.

**2. Eseguire i test di un passo.** Servono Node 22 e Git; il database dei test è in memoria, non va installato nulla.

```bash
git clone https://github.com/ash-ven/legacy-rescue.git
cd legacy-rescue
git checkout passo-4-test-di-sicurezza-in-pausa   # un passo qualsiasi della tabella
npm ci
npm test                                          # al passo 4: 34 test verdi e 3 in pausa
git checkout main                                 # per tornare alla versione finale
```

Dopo ogni cambio di passo serve di nuovo `npm ci`, perché le dipendenze cambiano da un passo all'altro.

**3. Provare l'API in locale.** Serve anche Docker, per avviare MongoDB. Gli esempi sono per Bash: su Windows si
usano da Git Bash, perché in PowerShell 5 le virgolette del JSON passato a `curl` si perdono.

```bash
docker compose up -d     # MongoDB su localhost:27017
npm run seed             # carica le due aziende inventate e i loro prodotti
npm start                # API su http://localhost:3000
curl -H "x-api-key: test-key-rossi" http://localhost:3000/products
```

Le chiavi `test-key-rossi` e `test-key-bianchi` sono finte e valgono solo in locale. Per vedere la vulnerabilità
principale, crea un ordine come Ferramenta Rossi e prova a leggerlo come Ortofrutta Bianchi:

```bash
curl -X POST -H "x-api-key: test-key-rossi" -H "content-type: application/json" \
  -d '{"items":[{"productId":"<_id delle Viti, da GET /products>","qty":1}]}' http://localhost:3000/orders
curl -H "x-api-key: test-key-bianchi" http://localhost:3000/orders/<_id dell'ordine appena creato>
```

Fino al passo 4 la seconda richiesta restituisce l'ordine di un'altra azienda; dal passo 5 risponde `404`.

## I passi

| Passo | Cosa succede | Scheda | Differenze |
|---|---|---|---|
| 1 · `passo-1-legacy` | Il codice di partenza: un solo file, nessun test | [scheda](docs/passi/01-legacy.md) | [codice](https://github.com/ash-ven/legacy-rescue/tree/passo-1-legacy) |
| 2 · `passo-2-rete-di-test` | 30 test di caratterizzazione che fotografano il comportamento attuale, difetti compresi; CI | [scheda](docs/passi/02-rete-di-test.md) | [1 → 2](https://github.com/ash-ven/legacy-rescue/compare/passo-1-legacy...passo-2-rete-di-test) |
| 3 · `passo-3-refactoring` | Rotte, servizi e repository: stesso comportamento, nessun test modificato; ESLint | [scheda](docs/passi/03-refactoring.md) | [2 → 3](https://github.com/ash-ven/legacy-rescue/compare/passo-2-rete-di-test...passo-3-refactoring) |
| 4 · `passo-4-test-di-sicurezza-in-pausa` | Test di isolamento tra aziende: 4 già verdi, 3 in pausa che descrivono le vulnerabilità | [scheda](docs/passi/04-test-in-pausa.md) | [3 → 4](https://github.com/ash-ven/legacy-rescue/compare/passo-3-refactoring...passo-4-test-di-sicurezza-in-pausa) |
| 5 · `passo-5-correzioni` | Filtro per azienda nei repository e campi modificabili: i test in pausa si attivano | [scheda](docs/passi/05-correzioni.md) | [4 → 5](https://github.com/ash-ven/legacy-rescue/compare/passo-4-test-di-sicurezza-in-pausa...passo-5-correzioni) |
| 6 · `passo-6-cambio-voluto` | Totali in centesimi, CSV conforme, input validati: cambi di comportamento dichiarati | [scheda](docs/passi/06-cambio-voluto.md) | [5 → 6](https://github.com/ash-ven/legacy-rescue/compare/passo-5-correzioni...passo-6-cambio-voluto) |
| 7 · `passo-7-revisione` | Revisione indipendente: race condition sulle scorte, mass assignment in creazione, errori senza dettagli interni | [scheda](docs/passi/07-revisione.md) | [6 → 7](https://github.com/ash-ven/legacy-rescue/compare/passo-6-cambio-voluto...passo-7-revisione) |

## Cosa dimostra
- **Test di caratterizzazione** con golden master scritto a mano (`test/support/golden.mjs`)
- **Refactoring sicuro** a test invariati, con la controprova che la rete di test rileva un cambio di comportamento
- **Sicurezza multi-tenant** (OWASP API Security Top 10: BOLA e mass assignment), con test di accettazione in pausa
  fino alla correzione
- **Cambi di comportamento dichiarati**: prima l'attesa nel test, poi il codice, poi la fotografia aggiornata solo dove serve
- **Race condition** riprodotta con un test e corretta con uno scarico atomico delle scorte
- **Revisione indipendente** dopo l'ultimo passo, con ogni problema chiuso da un test
- **Sinon** per orologio finto e stub di `fetch`; MongoDB reale ma in memoria
- **CI** su GitHub Actions: test con copertura (soglia 90%), ESLint, gitleaks

## Comandi

```bash
npm test                     # Mocha + Supertest su un MongoDB in memoria
npm run test:coverage        # copertura con c8
npm run test:update-golden   # riscrive le fotografie in test/golden: solo di proposito, poi si rilegge git diff
npm run lint                 # ESLint
```

## Rotte

| Rotta | Cosa fa |
|---|---|
| `GET /products?search=&low_stock=1` | prodotti dell'azienda, con ricerca per nome (testo semplice) e filtro sotto scorta |
| `POST /products` | crea un prodotto (`sku`, `name`, `price`, `qty`, `minQty`; gli altri campi sono ignorati) |
| `PUT /products/:id` | modifica `name`, `price`, `qty`, `minQty` di un prodotto dell'azienda |
| `GET /orders` | ordini dell'azienda |
| `GET /orders/:id` | dettaglio di un ordine dell'azienda (404 per quelli di altre aziende) |
| `POST /orders` | crea un ordine con prodotti dell'azienda, scala le scorte senza mai andare sotto zero e avvisa l'azienda via webhook |
| `GET /reports/low-stock.csv` | CSV dei prodotti sotto scorta (RFC 4180) |

Ogni richiesta porta l'header `x-api-key`, che identifica l'azienda. Gli errori sono sempre in JSON
(`{"error": "..."}`) e senza dettagli interni: `400` input non valido, `401` chiave mancante o sconosciuta,
`404` risorsa inesistente o di un'altra azienda, `409` SKU già usato, `500` errore inatteso.

## Metodo

Progettato con un processo a passi (design → piano → implementazione → revisione) e sviluppato con il supporto di
Claude Code. Design e piano sono in `docs/superpowers/`, le scelte di ogni passo in `docs/passi/`, le domande più
probabili in colloquio in [docs/colloquio.md](docs/colloquio.md).

## Licenza

MIT
