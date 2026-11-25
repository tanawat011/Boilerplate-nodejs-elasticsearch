// The routes against a stand-in Elasticsearch client: no server needed.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { loadConfig } from '../config/env.config.js';
import { serve } from './helpers.js';

const calls = [];
let failNext = null;
const fakeClient = {
  async search(params) {
    calls.push(['search', params]);
    if (failNext) throw failNext;
    return { hits: { hits: [{ _id: '1', _source: { character: 'Iron Man' } }] } };
  },
  async index(params) {
    calls.push(['index', params]);
    if (failNext) throw failNext;
    return { _id: 'abc', result: 'created' };
  },
};

let api;
before(async () => { api = await serve(fakeClient, { index: 'heroes', corsOrigin: 'http://example.test' }); });
after(() => api.server.close());

test('GET /heroes searches everything, or by name with ?q=', async () => {
  calls.length = 0;
  const all = await api.call('GET', '/heroes');
  assert.equal(all.status, 200);
  assert.deepEqual(all.body, [{ _id: '1', _source: { character: 'Iron Man' } }]);
  await api.call('GET', '/heroes?q=iron');
  assert.deepEqual(calls.map(([, p]) => p.query), [{ match_all: {} }, { match: { character: 'iron' } }]);
  assert.ok(calls.every(([, p]) => p.index === 'heroes'));
});

test('POST /heroes indexes the name and says its id', async () => {
  calls.length = 0;
  const r = await api.call('POST', '/heroes', { character_name: '  หนุมาน ' });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body, { _id: 'abc', result: 'created' });
  assert.deepEqual(calls[0][1].document, { character: 'หนุมาน' });
});

test('POST /heroes refuses a missing, empty or non-text name', async () => {
  calls.length = 0;
  for (const body of [{}, { character_name: '' }, { character_name: '   ' }, { character_name: 42 }, { character_name: 'x'.repeat(201) }]) {
    assert.equal((await api.call('POST', '/heroes', body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await api.call('POST', '/heroes', '{')).status, 400);
  assert.equal(calls.length, 0, 'nothing reached Elasticsearch');
});

test('a missing index is an empty list; other failures a 502 without internals', async (t) => {
  failNext = Object.assign(new Error('no index'), { meta: { body: { error: { type: 'index_not_found_exception' } } } });
  assert.deepEqual((await api.call('GET', '/heroes')).body, []);

  const logged = t.mock.method(console, 'error', () => {});
  failNext = new Error('connect ECONNREFUSED 10.0.0.5:9200');
  const r = await api.call('GET', '/heroes');
  failNext = null;
  assert.equal(r.status, 502);
  assert.equal(JSON.stringify(r.body).includes('10.0.0.5'), false);
  assert.equal(logged.mock.callCount(), 1);
});

test('CORS allows only the configured origin', async () => {
  const r = await api.call('OPTIONS', '/heroes');
  assert.equal(r.headers.get('access-control-allow-origin'), 'http://example.test');
});

test('settings come from the environment', () => {
  const c = loadConfig({ ELASTICSEARCH_URL: 'http://es:9200', ELASTICSEARCH_PASSWORD: 'p', PORT: '4000' });
  assert.equal(c.elasticsearch.node, 'http://es:9200');
  assert.deepEqual(c.elasticsearch.auth, { username: 'elastic', password: 'p' });
  assert.equal(c.port, 4000);
  assert.equal(loadConfig({}).elasticsearch.auth, undefined);
});
