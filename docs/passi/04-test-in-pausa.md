# Passo 4 – I test di sicurezza in pausa

**Tag:** `passo-4-test-di-sicurezza-in-pausa`

## Cosa succede
Si scrivono i test di **accettazione** sull'isolamento tra aziende: descrivono come l'API **deve** comportarsi, non come
si comporta. File: `test/security/tenant-isolation.test.mjs`.

**Già garantito oggi** (4 test verdi, servono a non perderlo in futuro):
- ogni azienda vede solo i propri prodotti e i propri ordini;
- il report CSV non contiene prodotti di altre aziende;
- non si modifica un prodotto di un'altra azienda.

**In pausa** (3 test con `it.skip`, la suite li mostra come *pending*):
- un'azienda non può leggere l'ordine di un'altra → oggi risponde 200 con l'ordine;
- modificare un prodotto non può cambiarne l'azienda → oggi il prodotto passa all'altra azienda;
- un ordine non può usare i prodotti di un'altra azienda → oggi l'ordine passa e le scorte altrui scendono.

Sono i difetti più classici delle API multi-tenant (OWASP API Security Top 10: *Broken Object Level Authorization* e
*Mass Assignment*).

## Perché "in pausa" e non rossi
- Una suite rossa per giorni smette di essere guardata: tutti si abituano al rosso, e il prossimo errore vero passa
  inosservato. In pausa la suite resta verde, ma i difetti sono **scritti, visibili e misurabili**: il conteggio
  "3 pending" è un promemoria che non si può ignorare.
- Quando arriva la correzione, basta togliere `.skip`: il test è già pronto e dice esattamente cosa deve succedere.
- Chi corregge non deve interpretare una segnalazione a parole: ha un criterio di accettazione eseguibile.

## Come si verifica
```bash
npm test     # 34 verdi, 3 pending
```
Prova a togliere `.skip` dai tre test: falliscono, ognuno con il motivo atteso (`expected 200 to equal 404`,
`expected 'bianchi' to equal 'rossi'`, `expected 201 to equal 404`). È così che si sa che i test controllano davvero
il difetto: un test di sicurezza che passa già prima della correzione non dimostra niente.

## Domande probabili in colloquio
- **"Cos'è un test di accettazione in pausa e perché lo usi?"** È il test del comportamento corretto, scritto prima della
  correzione e disattivato con `skip`. Documenta il difetto in forma eseguibile senza tenere la suite rossa; quando il
  fix arriva, si riattiva ed è la prova che il fix funziona.
- **"Come verifichi che un test di sicurezza sia valido prima del fix?"** Lo attivo e controllo che fallisca, e che
  fallisca per il motivo giusto. Se passasse già, starebbe testando la cosa sbagliata.
- **"Cos'è il BOLA?"** *Broken Object Level Authorization*: l'API controlla chi sei ma non se l'oggetto che chiedi è tuo.
  Qui bastava cambiare l'ID nell'URL per leggere l'ordine di un'altra azienda.
- **"E il mass assignment?"** L'API copia nel database tutti i campi ricevuti, anche quelli che il client non dovrebbe
  poter toccare, come `tenantId`.
- **"Perché tieni anche i test già verdi?"** Perché l'isolamento è una proprietà che si perde facilmente: basta una
  nuova query senza filtro. I test verdi la proteggono nel tempo.
