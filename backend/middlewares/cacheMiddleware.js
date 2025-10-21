
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; 

export function cacheMiddleware(ttl = CACHE_TTL) {
  return (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl}:${JSON.stringify(req.query)}`;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`✅ Cache hit: ${key}`);
      return res.json(cached.data);
    }

    // Sobrescribir res.json para cachear respuesta
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
        console.log(`💾 Cache stored: ${key}`);
      }
      originalJson.call(this, data);
    };

    next();
  };
}

// Limpiar cache periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);