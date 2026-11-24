// Adattatore unico: è l'unico punto dei test che sa come si costruisce l'app.
// Al refactoring cambia solo questo file, mai i test.
import legacy from '../../src/server.js';

export function buildApp(db) {
  legacy.setDb(db);
  return legacy.app;
}
