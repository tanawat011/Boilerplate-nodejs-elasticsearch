# Boilerplate: Node.js + Elasticsearch

A starting point for a REST API on Express that stores and searches
documents in Elasticsearch. The example resource is a list of heroes.

| Route | Does |
|---|---|
| `GET /heroes` | every hero (up to 100); `?q=iron` searches by name |
| `POST /heroes` | `{ "character_name": "Iron Man" }` → `201 { "_id": "...", "result": "created" }`, searchable at once |

Originally written in 2019 while learning Elasticsearch with Node.js (then
with Babel for ES6 modules); refreshed in Nov 2026: native ES modules on
Node 24+, Express 5, the Elasticsearch 9 client and server, settings in
environment variables, Elasticsearch security on, tests and CI.

## Quick start

Needs Node.js 24+ and Docker.

```sh
git clone https://github.com/tanawat011/Boilerplate-nodejs-elasticsearch.git
cd Boilerplate-nodejs-elasticsearch
cp .env.example .env          # dev-only placeholder password; change it if you like
docker compose up -d --wait   # Elasticsearch 9.5 on 127.0.0.1:19200 (about 1 GB of memory)
npm ci
npm run dev                   # http://127.0.0.1:3000, restarts on change

curl -X POST localhost:3000/heroes -H 'content-type: application/json' -d '{"character_name":"Iron Man"}'
curl 'localhost:3000/heroes?q=iron'
```

`docker compose down -v` stops Elasticsearch and deletes its data.

## Project layout

```
server.js               starts the server (settings, client, listen)
app.js                  the Express app and its routes
config/env.config.js    settings from environment variables
test/                   node:test tests
```

## Tests

```sh
npm run lint
npm test     # with .env from above, also against Elasticsearch in a throwaway index
```

Without `ELASTICSEARCH_TEST_INDEX_PREFIX` only the tests that need no
Elasticsearch run. CI runs `npm audit`, ESLint and the tests on Node 24 and
26, and the Elasticsearch tests against the compose node.
