import { Client } from '@elastic/elasticsearch';
import { createApp } from './app.js';
import { loadConfig } from './config/env.config.js';

const config = loadConfig();
const client = new Client(config.elasticsearch);
const app = createApp(client, { index: config.heroesIndex, corsOrigin: config.corsOrigin });

const server = app.listen(config.port, config.host, () => {
  console.log('\x1b[36m%s\x1b[0m', `(${config.NODE_ENV}) Server is running on http://${config.host}:${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => client.close()));
}
