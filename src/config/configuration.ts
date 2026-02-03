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
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
});
