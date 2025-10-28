const NodeCache = require('node-cache');

// Create a cache instance with default TTL of 10 minutes
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Cache middleware for GET requests
const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Generate cache key from URL and organization ID
  const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
  const cacheKey = `${req.originalUrl}_${organizationId || 'public'}`;

  // Try to get data from cache
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.json(cachedData);
  }

  // Override res.send to cache the response
  const originalSend = res.send;
  res.send = function(data) {
    // Cache the response data
    cache.set(cacheKey, JSON.parse(data));
    console.log(`Cache set for ${cacheKey}`);
    originalSend.call(this, data);
  };

  next();
};

// Function to clear cache for a specific key pattern
const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  cache.del(matchingKeys);
  console.log(`Cache cleared for pattern: ${pattern}`);
};

module.exports = { cacheMiddleware, clearCache, cache };