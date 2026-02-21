export default () => ({
  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
  },
  qdrant: {
    apiKey: process.env.QDRANT_API_KEY,
    url: process.env.QDRANT_ENDPOINT_URL,
  },
  ai: {
    endpoint: process.env.AI_ENDPOINT,
  },
  mistral: {
    endpoint: process.env.MISTRAL_ENDPOINT,
    cookie: process.env.MISTRAL_COOKIE,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'playlist_automation',
    collection: process.env.MONGODB_COLLECTION || 'tasks',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  taskEmbedder: {
    // Standard cron: every 5 minutes
    cron: process.env.TASK_EMBEDDER_CRON || '*/5 * * * *',
  },
});
