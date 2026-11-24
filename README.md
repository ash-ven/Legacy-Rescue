# legacy-rescue

Come si mette in sicurezza un'API legacy **senza riscriverla da zero**: prima la si fotografa con i test, poi la si
riordina, poi si correggono i difetti di sicurezza, un passo alla volta. Ogni passo è un commit con un tag: si può
aprire, eseguire e confrontare con il precedente.

L'applicazione è inventata apposta: un'API di magazzino usata da più aziende (multi-tenant). Il codice di partenza è
**volutamente scritto male**, come capita di trovarlo nei progetti veri.

> Storia in corso: i passi si aggiungono uno alla volta.

## I passi

| Passo | Tag | Cosa succede | Scheda |
|---|---|---|---|
| 1 | `passo-1-legacy` | Il codice com'è: un solo file, nessun test | [01-legacy](docs/passi/01-legacy.md) |
| 2 | `passo-2-rete-di-test` | 30 test di caratterizzazione che fotografano il comportamento attuale, difetti compresi; CI | [02-rete-di-test](docs/passi/02-rete-di-test.md) |
| 3 | `passo-3-refactoring` | Rotte, servizi e repository: stesso comportamento, nessun test cambiato; ESLint | [03-refactoring](docs/passi/03-refactoring.md) |
| 4 | `passo-4-test-di-sicurezza-in-pausa` | Test di isolamento tra aziende: 4 già verdi, 3 in pausa che descrivono i difetti | [04-test-in-pausa](docs/passi/04-test-in-pausa.md) |
| 5 | `passo-5-correzioni` | Filtro per azienda nei repository e campi modificabili: i test in pausa si attivano | [05-correzioni](docs/passi/05-correzioni.md) |

## Test

```bash
npm test                     # Mocha + Supertest su un MongoDB in memoria (nessun servizio da avviare)
npm run test:coverage        # copertura con c8
npm run test:update-golden   # riscrive le fotografie in test/golden: solo di proposito, poi rileggere git diff
npm run lint                 # ESLint
```

## Provarla in locale

Servono Node 22 e Docker (solo per avviare l'API: i test, dal passo 2, non ne hanno bisogno).

```bash
npm install
docker compose up -d     # MongoDB su localhost:27017
npm run seed             # due aziende inventate: Ferramenta Rossi e Ortofrutta Bianchi
npm start                # API su http://localhost:3000
curl -H "x-api-key: test-key-rossi" http://localhost:3000/products
```

Le chiavi `test-key-rossi` e `test-key-bianchi` sono finte e servono solo in locale.

## Rotte

| Rotta | Cosa fa |
|---|---|
| `GET /products?search=&low_stock=1` | prodotti dell'azienda, con ricerca per nome e filtro sotto scorta |
| `POST /products` | crea un prodotto |
| `PUT /products/:id` | modifica un prodotto |
| `GET /orders` | ordini dell'azienda |
| `GET /orders/:id` | dettaglio di un ordine |
| `POST /orders` | crea un ordine, scala le scorte e avvisa l'azienda con una chiamata HTTP |
| `GET /reports/low-stock.csv` | CSV dei prodotti sotto scorta |

Ogni richiesta porta l'header `x-api-key`, che dice di quale azienda è.

## Come è stato fatto

Progettato con un metodo a passi (design → piano → implementazione → revisione) e sviluppato con l'aiuto di
Claude Code; ogni scelta è spiegata nelle schede in `docs/passi/`. Design e piano sono in `docs/superpowers/`.

## Licenza

MIT
