// The API against a real Elasticsearch (ELASTICSEARCH_URL and its user /
// password). Skipped unless ELASTICSEARCH_TEST_INDEX_PREFIX is set; each run
// makes its own index and deletes it.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { Client } from '@elastic/elasticsearch';
import { loadConfig } from '../config/env.config.js';
import { serve } from './helpers.js';

const prefix = process.env.ELASTICSEARCH_TEST_INDEX_PREFIX;

describe('elasticsearch', { skip: prefix ? false : 'set ELASTICSEARCH_TEST_INDEX_PREFIX (and ELASTICSEARCH_*) to run; see README' }, () => {
  const index = `${prefix}-${Date.now()}`;
  let client;
  let api;
  before(async () => {
    client = new Client(loadConfig().elasticsearch);
    api = await serve(client, { index });
  });
  after(async () => {
    api?.server.close();
    await client?.indices.delete({ index }, { ignore: [404] });
    await client?.close();
  });

  test('an empty index answers an empty list', async () => {
    assert.deepEqual((await api.call('GET', '/heroes')).body, []);
  });

  test('heroes indexed by POST are found by GET, by name too', async () => {
    for (const name of ['Iron Man', 'Spider-Man', 'หนุมาน']) {
      assert.equal((await api.call('POST', '/heroes', { character_name: name })).status, 201);
    }
    const all = (await api.call('GET', '/heroes')).body.map((h) => h._source.character).sort();
    assert.deepEqual(all, ['Iron Man', 'Spider-Man', 'หนุมาน'].sort());

    const iron = (await api.call('GET', '/heroes?q=iron')).body.map((h) => h._source.character);
    assert.deepEqual(iron, ['Iron Man']);
    const thai = (await api.call('GET', `/heroes?q=${encodeURIComponent('หนุมาน')}`)).body.map((h) => h._source.character);
    assert.deepEqual(thai, ['หนุมาน']);
  });
});
