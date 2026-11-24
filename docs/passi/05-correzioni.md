# Passo 5 – Le correzioni

**Tag:** `passo-5-correzioni`

## Cosa succede, in ordine
1. **Rosso:** tolto `.skip` ai tre test di sicurezza → falliscono, ognuno per il motivo atteso.
2. **Correzione**, nei repository, dove ora vive l'accesso ai dati:
   - `findOrderById(db, tenantId, id)` filtra anche per azienda: l'ordine di un altro risulta **inesistente** (404);
   - `findProductsByIds(db, tenantId, ids)` filtra per azienda: in un ordine un prodotto altrui risulta inesistente
     (404) e le sue scorte non si toccano;
   - `updateProduct` applica solo i **campi modificabili** (`name`, `price`, `qty`, `minQty`): `tenantId`, `_id` e `sku`
     vengono ignorati. Se non resta niente da modificare, restituisce il prodotto com'è.
3. **Verde:** i tre test di sicurezza passano. Falliscono invece, e **solo loro**, le tre caratterizzazioni che
   fotografavano quei difetti: è il segnale giusto, la rete ha visto esattamente i comportamenti cambiati.
4. **Aggiornamento voluto** delle tre caratterizzazioni: titolo da `[difetto]` a `[corretto al passo 5]`, nuove
   fotografie con `npm run test:update-golden -- --grep "corretto al passo 5"`, e diff riletto:

| Fotografia | Prima | Dopo |
|---|---|---|
| `orders-dettaglio-altra-azienda` | 200 con l'ordine di Rossi | 404 `order not found` |
| `orders-prodotto-altra-azienda` | 201, ordine creato con le Mele di Bianchi | 404 `product not found` |
| `products-modifica-tenant-risposta` | `tenantId: "bianchi"` | `tenantId: "rossi"` |
| `products-modifica-tenant-elenco-bianchi` | Bianchi vede il Martello di Rossi | solo le Mele |

Nessun'altra fotografia è cambiata.

## Scelte da saper spiegare
- **404 e non 403 per le risorse di altri:** un 403 confermerebbe che l'ordine esiste. Per chi non ne ha diritto, la
  risorsa semplicemente non c'è.
- **Il filtro per azienda nel repository**, non nelle rotte: è l'unico punto che parla con il database, quindi non si
  può dimenticare in una rotta nuova. Il refactoring del passo 3 è servito proprio a questo.
- **Elenco dei campi permessi** (*allow list*) invece di un elenco dei vietati: un campo nuovo è escluso finché qualcuno
  non decide di permetterlo.
- **`sku` non modificabile:** è l'identificativo del prodotto, e gli ordini passati lo riportano.

## Come si verifica
```bash
npm test                                      # 37 verdi, 0 pending
git diff passo-4-test-di-sicurezza-in-pausa passo-5-correzioni --stat -- test/golden   # solo le 4 fotografie della tabella
```

## Domande probabili in colloquio
- **"Come hai corretto il BOLA?"** Filtrando sempre per azienda nel repository, e rispondendo 404 per le risorse di
  altri. I test in pausa del passo 4 sono diventati la prova che funziona.
- **"Perché alcuni test di caratterizzazione sono cambiati, se dovevano proteggere il comportamento?"** Perché questa
  volta il cambio era voluto. Proteggono da cambi *accidentali*: quando un cambio è intenzionale, li aggiorno di
  proposito, solo quelli coinvolti, e il commit lo dice.
- **"Come sai di non aver cambiato altro?"** Sono fallite solo le tre caratterizzazioni dei difetti, e il diff delle
  fotografie contiene solo quei cambi.
- **"Allow list o deny list?"** Allow list: è sicura per impostazione predefinita, anche quando qualcuno aggiunge un
  campo al modello senza pensarci.
