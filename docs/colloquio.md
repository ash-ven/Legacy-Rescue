# legacy-rescue in colloquio

## Il progetto in un minuto
> In tirocinio scrivo test su un backend legacy che non posso mostrare. Allora ho rifatto il metodo su un progetto mio:
> un'API di magazzino multi-tenant scritta apposta "alla vecchia". Prima l'ho fotografata con 30 test di
> caratterizzazione, difetti compresi; poi l'ho riordinata in rotte, servizi e repository senza cambiare un test; poi
> ho scritto i test di sicurezza sull'isolamento tra aziende, tenuti in pausa finché non è arrivata la correzione; alla
> fine ho trasformato le stranezze in comportamenti corretti, un cambio voluto alla volta. Ogni passo è un commit con un
> tag, e la CI esegue test, copertura, lint e controllo dei segreti.

## Le domande più probabili

**Metodo**
- *Da dove parti con un codice legacy senza test?* Dal capire cosa fa: test di caratterizzazione che fotografano il
  comportamento attuale, prima di cambiare una riga. → [passo 2](passi/02-rete-di-test.md)
- *Perché non riscriverlo?* Una riscrittura perde i comportamenti non documentati da cui qualcuno dipende. → [passo 1](passi/01-legacy.md)
- *Come sai che il refactoring non ha rotto niente?* I test di caratterizzazione non sono cambiati e sono verdi; e ho
  verificato che la rete fallisce se cambio un comportamento. → [passo 3](passi/03-refactoring.md)
- *Perché refactoring e correzioni in commit separati?* Si verificano in modi opposti: nel primo i test non cambiano,
  nella seconda uno cambia di proposito.

**Test**
- *Caratterizzazione o test normale?* Il primo registra cosa succede, il secondo cosa dovrebbe succedere.
- *Come gestisci ID e date che cambiano?* ID normalizzati nel confronto, orologio finto con Sinon.
- *Mock, stub, fake?* Qui: `fetch` sostituito con uno stub (risposta decisa dal test, chiamate controllabili), `Date`
  con un orologio finto. Il database invece è vero, in memoria: un mock del database testerebbe il mock.
- *Cos'è un test in pausa?* Il test del comportamento corretto, scritto prima del fix e disattivato con `skip`. Suite
  verde, difetto documentato, criterio di accettazione pronto. → [passo 4](passi/04-test-in-pausa.md)
- *Come sai che un test di sicurezza è valido?* Lo attivo prima del fix e controllo che fallisca per il motivo giusto.
- *Copertura?* 92% delle righe, soglia 90% in CI. Non è un obiettivo in sé: le righe scoperte sono l'avvio e un ramo di
  errore generico.

**Sicurezza**
- *BOLA?* L'API controlla chi sei ma non se l'oggetto è tuo. Corretto filtrando sempre per azienda nel repository, con
  404 per le risorse altrui. → [passo 5](passi/05-correzioni.md)
- *Mass assignment?* L'API salvava tutti i campi ricevuti, anche `tenantId`. Corretto con un elenco dei campi permessi.
- *Perché 404 e non 403?* Un 403 conferma che la risorsa esiste.
- *gitleaks?* Controlla che non entrino segreti nel repository, anche nella storia. L'eccezione vale solo per due chiavi
  finte documentate.

**Strumenti**
- Node 22, Express 4, MongoDB 6 · Mocha, Chai, Sinon, Supertest, mongodb-memory-server · c8 · ESLint 9 · GitHub Actions · gitleaks.

## "L'hai scritto tu?"
Rispondi com'è: *"L'ho progettato e guidato io, e il codice l'ho scritto con Claude Code seguendo un metodo: design,
piano, un passo alla volta, revisione. Ogni scelta è documentata nelle schede e la so spiegare. È lo stesso modo in cui
lavoro in tirocinio."* Poi apri un passo a caso e raccontalo: è la prova migliore.
