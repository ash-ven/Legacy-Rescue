// Adattatore unico: è l'unico punto dei test che sa come si costruisce l'app.
// Al refactoring (passo 3) è cambiato solo questo file, mai i test.
import appModule from '../../src/app.js';

export function buildApp(db) {
  return appModule.createApp({ db });
}
