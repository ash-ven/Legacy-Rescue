# legacy-rescue

[![CI](https://github.com/ash-ven/legacy-rescue/actions/workflows/ci.yml/badge.svg)](https://github.com/ash-ven/legacy-rescue/actions/workflows/ci.yml)

Come si mette in sicurezza un'API legacy **senza riscriverla da zero**: prima la si fotografa con i test, poi la si
riordina, poi si correggono i difetti di sicurezza, un passo alla volta. Ogni passo è un commit con un tag: si può
aprire, eseguire e confrontare con il precedente.

L'applicazione è inventata apposta: un'API di magazzino usata da più aziende (multi-tenant). Il codice di partenza è
**volutamente scritto male**, come capita di trovarlo nei progetti veri.

> **In English.** A step-by-step rescue of a deliberately messy multi-tenant Node.js/Express/MongoDB API:
> characterization tests with golden masters pin the legacy behaviour (defects included), a refactor into
> routes/services/repositories keeps every test untouched, tenant-isolation acceptance tests (BOLA, mass assignment)
> stay pending until the fix, and finally intentional behaviour changes are made test-first. One commit and one tag per
> step; CI runs tests with coverage, ESLint and gitleaks. Docs are in Italian.

## I passi

| Passo | Tag | Cosa succede | Scheda |
|---|---|---|---|
| 1 | `passo-1-legacy` | Il codice com'è: un solo file, nessun test | [01-legacy](docs/passi/01-legacy.md) |
| 2 | `passo-2-rete-di-test` | 30 test di caratterizzazione che fotografano il comportamento attuale, difetti compresi; CI | [02-rete-di-test](docs/passi/02-rete-di-test.md) |
| 3 | `passo-3-refactoring` | Rotte, servizi e repository: stesso comportamento, nessun test cambiato; ESLint | [03-refactoring](docs/passi/03-refactoring.md) |
| 4 | `passo-4-test-di-sicurezza-in-pausa` | Test di isolamento tra aziende: 4 già verdi, 3 in pausa che descrivono i difetti | [04-test-in-pausa](docs/passi/04-test-in-pausa.md) |
| 5 | `passo-5-correzioni` | Filtro per azienda nei repository e campi modificabili: i test in pausa si attivano | [05-correzioni](docs/passi/05-correzioni.md) |
| 6 | `passo-6-cambio-voluto` | Totali in centesimi, CSV corretto, input validati: cambi voluti, test prima | [06-cambio-voluto](docs/passi/06-cambio-voluto.md) |

Per vedere un passo: `git checkout passo-3-refactoring && npm ci && npm test`.
Per vedere cosa è cambiato: `git diff passo-2-rete-di-test passo-3-refactoring --stat`.

## Cosa mostra
- **Test di caratterizzazione** con golden master scritto a mano (`test/support/golden.mjs`)
- **Refactoring sicuro** a test invariati, con controprova che la rete se ne accorge
- **Test di sicurezza multi-tenant** (OWASP API: BOLA e mass assignment), tenuti in pausa fino alla correzione
- **Cambi di comportamento dichiarati**: attesa nel test prima, codice dopo, fotografia aggiornata solo dove serve
- **Sinon** per orologio finto e stub di `fetch`; MongoDB vero ma in memoria
- **CI** su GitHub Actions: test con copertura (soglia 90%), ESLint, gitleaks

## Provarla in locale

Servono Node 22 e, solo per avviare l'API, Docker.

```bash
npm install
docker compose up -d     # MongoDB su localhost:27017
npm run seed             # due aziende inventate: Ferramenta Rossi e Ortofrutta Bianchi
npm start                # API su http://localhost:3000
curl -H "x-api-key: test-key-rossi" http://localhost:3000/products
```

Le chiavi `test-key-rossi` e `test-key-bianchi` sono finte e servono solo in locale.

## Test

```bash
npm test                     # Mocha + Supertest su un MongoDB in memoria (nessun servizio da avviare)
npm run test:coverage        # copertura con c8
npm run test:update-golden   # riscrive le fotografie in test/golden: solo di proposito, poi rileggere git diff
npm run lint                 # ESLint
```

## Rotte

| Rotta | Cosa fa |
|---|---|
| `GET /products?search=&low_stock=1` | prodotti dell'azienda, con ricerca per nome (testo semplice) e filtro sotto scorta |
| `POST /products` | crea un prodotto |
| `PUT /products/:id` | modifica `name`, `price`, `qty`, `minQty` di un prodotto dell'azienda |
| `GET /orders` | ordini dell'azienda |
| `GET /orders/:id` | dettaglio di un ordine dell'azienda (404 per quelli di altri) |
| `POST /orders` | crea un ordine con prodotti dell'azienda, scala le scorte e avvisa l'azienda via webhook |
| `GET /reports/low-stock.csv` | CSV dei prodotti sotto scorta (RFC 4180) |

Ogni richiesta porta l'header `x-api-key`, che dice di quale azienda è. Errori: `401` chiave mancante o sconosciuta,
`400` input non valido, `404` risorsa inesistente o di un'altra azienda.

## Come è stato fatto

Progettato con un metodo a passi (design → piano → implementazione → revisione) e sviluppato con l'aiuto di
Claude Code. Design e piano sono in `docs/superpowers/`, le scelte di ogni passo in `docs/passi/`, le domande più
probabili in [docs/colloquio.md](docs/colloquio.md).

## Licenza

MIT
