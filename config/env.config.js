// Settings from the environment (`node --env-file=.env` reads .env).
// See .env.example for every name.
export function loadConfig(env = process.env) {
  return {
    NODE_ENV: env.NODE_ENV || 'development',
    port: Number(env.PORT || 3000),
    host: env.HOST || '127.0.0.1',
    elasticsearch: {
      node: env.ELASTICSEARCH_URL || 'http://127.0.0.1:9200',
      // Left out when no password is set (an Elasticsearch without security).
      auth: env.ELASTICSEARCH_PASSWORD
        ? { username: env.ELASTICSEARCH_USERNAME || 'elastic', password: env.ELASTICSEARCH_PASSWORD }
        : undefined,
    },
    heroesIndex: env.HEROES_INDEX || 'heroes',
    corsOrigin: env.CORS_ORIGIN || 'http://localhost:4200',
  };
}
