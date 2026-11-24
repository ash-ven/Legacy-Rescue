// Richieste all'API come una certa azienda (chiave nell'header x-api-key).
import request from 'supertest';
import { buildApp } from './app.mjs';
import { getDb } from './hooks.mjs';

export function api(key) {
  const app = buildApp(getDb());
  const withKey = (req) => (key ? req.set('x-api-key', key) : req);
  return {
    get: (url) => withKey(request(app).get(url)),
    post: (url, body) => withKey(request(app).post(url).send(body)),
    put: (url, body) => withKey(request(app).put(url).send(body)),
  };
}
