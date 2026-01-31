export default () => ({
  qdrant: {
    apiKey: process.env.QDRANT_API_KEY,
    url: process.env.QDRANT_ENDPOINT_URL,
  },
  ai: {
    endpoint: process.env.AI_ENDPOINT,
  },
});
