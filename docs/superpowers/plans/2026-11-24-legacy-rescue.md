# legacy-rescue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un repository che racconta in 6 passi (un commit e un tag ciascuno) il salvataggio di un'API di magazzino legacy con test di caratterizzazione, refactoring, test di sicurezza in pausa e correzioni.

**Architecture:** Codice applicativo CommonJS (com'è il legacy), test in ESM (`.test.mjs`) con Mocha come root-hook plugin che avvia un MongoDB in memoria. Un adattatore unico (`test/support/app.mjs`) costruisce l'app: è l'unico file di test che cambia al refactoring.

**Tech Stack:** Node 22, Express 4, mongodb 6, Mocha 11, Chai 5, Sinon, Supertest, mongodb-memory-server, c8, ESLint 9, GitHub Actions, gitleaks.

**Spec:** `docs/superpowers/specs/2026-11-24-legacy-rescue-design.md`

## Global Constraints

- Node 22 (`.nvmrc` = `22`); file in LF (`.gitattributes`: `* text=auto eol=lf`).
- Autore commit: `Asiha Venturi <349882423+ash-ven@users.noreply.github.com>` (config locale); ogni messaggio termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nessun push.
- Un commit per passo, tag annotato `passo-N-<nome>` sul commit.
- Dati inventati: tenant `rossi` (Ferramenta Rossi, chiave `test-key-rossi`), `bianchi` (Ortofrutta Bianchi, chiave `test-key-bianchi`); webhook `https://example.test/hooks/<tenant>`.
- Niente riferimenti al progetto del tirocinio, al cliente o ai suoi difetti; difetti solo da manuale.
- Orologio dei test: `2026-11-24T09:00:00.000Z`, solo `Date` finto (`toFake: ['Date']`).
- Database dei test: `legacy-rescue-test`.
- Messaggi d'errore del legacy (da conservare fino al passo 6): `{"error":"missing api key"}` 401, `{"error":"invalid api key"}` 401, `{"error":"product not found"}` 404, `{"error":"order not found"}` 404, `{"error":"not enough stock for <sku>"}` 400.

## Review Focus

1. Ordine con un `productId` di un'altra azienda: oggi scala le scorte altrui → test di sicurezza al passo 4, corretto al passo 5.
2. Quantità negativa, zero o non intera in un ordine: oggi aumenta le scorte → fotografato al passo 2, rifiutato con 400 al passo 6.
3. Ordine con `items` vuoto: oggi crea un ordine da 0 → fotografato al passo 2, 400 al passo 6.
4. `search` con caratteri da espressione regolare (es. `(`): oggi 500 → fotografato al passo 2, cercato come testo al passo 6.
5. ID non valido in `GET /orders/:id` e `PUT /products/:id`: oggi 500 → fotografato (solo lo stato) al passo 2, 400 `{"error":"invalid id"}` al passo 6.

---

### Task 1: passo-1-legacy

**Files:**
- Create: `package.json`, `.nvmrc`, `.gitignore`, `.gitattributes`, `docker-compose.yml`, `src/server.js`, `README.md`, `docs/passi/01-legacy.md`

**Interfaces:**
- Produces: `src/server.js` che all'avvio legge `MONGO_URL` (default `mongodb://localhost:27017/legacy-rescue`) e `PORT` (default 3000), crea l'indice unico `{tenantId:1, sku:1}` su `products`, ascolta. Collezioni: `tenants {_id:'rossi', name, webhookUrl}`, `apikeys {key, tenantId}`, `products {tenantId, sku, name, price, qty, minQty}`, `orders {tenantId, items:[{productId, sku, qty, price}], total, createdAt}`.

- [ ] **Step 1:** `git init`, config locale autore, file di base; `npm init` con `express@4`, `mongodb@6`; script `start`.
- [ ] **Step 2: scrivere `src/server.js` in stile legacy** (`var`, `.then`, logica nelle rotte, `db` globale) con le rotte della tabella del design e i difetti seminati: `PUT /products/:id` usa `{$set: req.body}`; `GET /orders/:id` cerca solo per `_id`; `POST /orders` cerca i prodotti solo per `_id`, scala `qty` senza validare, totale `sum(price*qty)` senza arrotondare, `createdAt: new Date()`, poi `fetch(tenant.webhookUrl, {method:'POST', body: JSON.stringify({event:'order.created', orderId})})` senza attendere né gestire errori; `search` diventa `new RegExp(search, 'i')`; CSV `sku,name,qty,minQty` concatenato senza virgolette.
- [ ] **Step 3: verifica a mano:** `docker compose up -d`, `npm start`, `GET /products` senza chiave → 401 `{"error":"missing api key"}`. Se Docker non è avviato si salta: dal passo 2 i test coprono tutto.
- [ ] **Step 4:** README "stato di partenza" + scheda `docs/passi/01-legacy.md` (cosa c'è di storto, perché non si tocca ancora).
- [ ] **Step 5:** commit `chore: legacy warehouse API as found (no tests)`, tag `passo-1-legacy`.

### Task 2: passo-2-rete-di-test

**Files:**
- Modify: `src/server.js` (solo la cucitura: `module.exports = { app, setDb }`, avvio sotto `require.main === module`)
- Create: `.mocharc.json`, `.c8rc.json`, `test/support/hooks.mjs`, `test/support/fixtures.mjs`, `test/support/app.mjs`, `test/support/golden.mjs`, `test/characterization/{auth,products,orders,reports}.test.mjs`, `test/golden/*.json`, `.github/workflows/ci.yml`, `docs/passi/02-rete-di-test.md`

**Interfaces:**
- Produces: `getDb(): Db` (hooks); `seed(db): Promise<{ids}>` (fixtures, restituisce gli `_id` dei prodotti per nome); `buildApp(db): express.Application` (adattatore); `expectGolden(name: string, res: supertest.Response): void` (registra `{status, contentType, body}` normalizzato: ogni stringa esadecimale di 24 caratteri diventa `<id-N>` in ordine di apparizione; con file mancante fallisce a meno di `UPDATE_GOLDEN=1`); `api(key)` → `{get, post, put}` di supertest con header impostato.
- Fixture minime: rossi → `VIT-4` "Viti, 4mm" price 0.1 qty 100 minQty 10; `MAR-1` "Martello" price 12.5 qty 3 minQty 5; bianchi → `MEL-1` "Mele" price 2.2 qty 50 minQty 10.

- [ ] **Step 1: test di caratterizzazione** (uno per comportamento, nomi in italiano): chiave mancante/errata; elenco, ricerca `vit`, `low_stock=1`, creazione, SKU duplicato (fotografa il 500 di Mongo), modifica normale, **modifica con `tenantId` che sposta il prodotto** (fotografa il difetto); ordine valido (scorte scalate, totale `0.30000000000000004` per 3 viti, `createdAt` = orologio finto, `fetch` chiamato una volta con l'URL del webhook), scorte insufficienti, quantità negativa, `items` vuoto, **lettura ordine di un'altra azienda = 200** (fotografa il difetto), **ordine con prodotto di un'altra azienda** (fotografa il difetto), ID non valido (solo stato 500), `search=(` (solo stato 500); CSV basso stock con la riga rotta.
- [ ] **Step 2: eseguire** `npx mocha` → falliscono per golden mancanti; `UPDATE_GOLDEN=1 npx mocha` le crea; rileggere ogni golden a mano.
- [ ] **Step 3:** `npm test` (mocha) e `npm run test:coverage` (c8, soglia righe 90) verdi.
- [ ] **Step 4:** CI `ci.yml`: job `test` (setup-node da `.nvmrc`, cache dei binari Mongo `~/.cache/mongodb-binaries`, `npm ci`, `npm run test:coverage`) e job `gitleaks` (`gitleaks/gitleaks-action@v2`, `fetch-depth: 0`); `gitleaks detect` in locale pulito.
- [ ] **Step 5:** scheda 02 (caratterizzazione, golden master, cucitura, orologio finto, stub di fetch); riga nel README; commit `test: characterization safety net for the legacy API`, tag `passo-2-rete-di-test`.

### Task 3: passo-3-refactoring

**Files:**
- Create: `src/app.js`, `src/db.js`, `src/notify.js`, `src/middleware/tenant.js`, `src/repositories/{products,orders,tenants}.js`, `src/services/orders.js`, `src/routes/{products,orders,reports}.js`, `eslint.config.js`, `docs/passi/03-refactoring.md`
- Modify: `src/server.js` (solo avvio), `test/support/app.mjs` (unico file di test toccato), `.github/workflows/ci.yml` (job `lint`)

**Interfaces:**
- Produces: `createApp({ db }): express.Application`; `ensureIndexes(db): Promise<void>`; `notifyTenant(tenant, event): void`; repository con funzioni `(db, ...)`; `createOrder(db, tenant, items): Promise<order>`.

- [ ] **Step 1:** estrarre a piccoli passi con i test verdi a ogni estrazione; `async/await`, `const/let`; **stesso comportamento, difetti compresi**.
- [ ] **Step 2:** `git diff passo-2-rete-di-test -- test/characterization test/golden` vuoto; `npm test`, `npm run test:coverage`, `npm run lint` verdi.
- [ ] **Step 3:** scheda 03 + README; commit `refactor: split the legacy server into routes, services and repositories`, tag `passo-3-refactoring`.

### Task 4: passo-4-test-di-sicurezza-in-pausa

**Files:**
- Create: `test/security/tenant-isolation.test.mjs`, `docs/passi/04-test-in-pausa.md`

- [ ] **Step 1:** test di controllo già verdi (elenchi prodotti, ordini e CSV restano nella propria azienda); test in pausa con `it.skip`, titolo che dice il motivo: lettura ordine altrui → 404 `order not found`; modifica con `tenantId` → 200 e prodotto ancora di rossi; ordine con prodotto altrui → 404 `product not found` e scorte di bianchi intatte.
- [ ] **Step 2:** `npm test` verde con 3 pending; togliendo `.skip` in locale falliscono (verificato, non committato).
- [ ] **Step 3:** scheda 04 + README; commit `test: tenant isolation acceptance tests, pending until the fix`, tag `passo-4-test-di-sicurezza-in-pausa`.

### Task 5: passo-5-correzioni

**Files:**
- Modify: `src/repositories/{orders,products}.js`, `src/services/orders.js`, `src/routes/products.js`, `test/security/tenant-isolation.test.mjs` (via gli `.skip`), `test/characterization/{products,orders}.test.mjs` e golden dei tre casi che fotografavano i difetti
- Create: `docs/passi/05-correzioni.md`

- [ ] **Step 1:** togliere gli `.skip` → rossi; correggere: filtro `tenantId` obbligatorio in `findOrderById` e nella ricerca dei prodotti dell'ordine; campi modificabili `name, price, qty, minQty`.
- [ ] **Step 2:** aggiornare **di proposito** le tre caratterizzazioni dei difetti (nuove attese), `npm test` verde senza pending.
- [ ] **Step 3:** scheda 05 + README; commit `fix: enforce tenant isolation on orders and product updates` con i tre cambi elencati nel corpo, tag `passo-5-correzioni`.

### Task 6: passo-6-cambio-voluto

**Files:**
- Create: `src/csv.js` (`toCsvField(value): string`, RFC 4180), `src/validation.js` (`isValidId`, `parseOrderItems`), `test/unit/{csv,validation}.test.mjs`, `docs/passi/06-cambio-voluto.md`, `docs/colloquio.md`
- Modify: servizi/rotte interessati, golden interessati, README completo con riassunto in inglese

- [ ] **Step 1: test unitari prima:** `toCsvField('Viti, 4mm') === '"Viti, 4mm"'`, `toCsvField('a"b') === '"a""b"'`, `toCsvField(5) === '5'`; `parseOrderItems([])` → errore; `qty` 0, -1, 1.5 → errore.
- [ ] **Step 2:** cambi voluti: totale `Math.round(x*100)/100`; CSV con `toCsvField`; ID non valido → 400 `invalid id`; ordine vuoto o quantità non valida → 400 `invalid items`; `search` cercato come testo (escape).
- [ ] **Step 3:** `UPDATE_GOLDEN=1` solo sui casi coinvolti, `git diff test/golden` riletto e riportato nella scheda; tutto verde, copertura e lint ok, `gitleaks detect` pulito.
- [ ] **Step 4:** commit `feat: round totals, valid CSV and input validation (intentional changes)`, tag `passo-6-cambio-voluto`.

### Task 7: verifica finale

- [ ] Checkout di ogni tag e `npm ci && npm test` verde (pending solo al passo 4).
- [ ] Revisione indipendente dell'intero repository da un agente nuovo, poi correzioni in un commit a parte se servono.
