import cors from 'cors';
import express from 'express';

// createApp builds the API on an @elastic/elasticsearch client.
export function createApp(client, { index = 'heroes', corsOrigin = 'http://localhost:4200' } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin, allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization'] }));
  app.use(express.json({ limit: '100kb' }));

  // Every hero, or those whose name matches ?q=.
  app.get('/heroes', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    try {
      const result = await client.search({
        index,
        query: q ? { match: { character: q } } : { match_all: {} },
        size: 100,
      });
      res.json(result.hits.hits);
    } catch (err) {
      if (err?.meta?.body?.error?.type === 'index_not_found_exception') {
        res.json([]); // nothing indexed yet
        return;
      }
      throw err;
    }
  });

  app.post('/heroes', async (req, res) => {
    const name = req.body?.character_name;
    if (typeof name !== 'string' || name.trim() === '' || name.length > 200) {
      res.status(400).json({ error: 'character_name must be text of 1 to 200 characters' });
      return;
    }
    const result = await client.index({
      index,
      document: { character: name.trim() },
      refresh: 'wait_for', // searchable when this answers
    });
    res.status(201).json({ _id: result._id, result: result.result });
  });

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // Express 5 sends a rejected promise here. The client gets no
  // Elasticsearch internals; the server log gets the cause.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status ?? err.statusCode;
    if (status >= 400 && status < 500 && err.type) {
      res.status(status).json({ error: err.message }); // e.g. broken JSON body
      return;
    }
    console.error(err);
    res.status(502).json({ error: 'Elasticsearch did not answer as expected' });
  });

  return app;
}
