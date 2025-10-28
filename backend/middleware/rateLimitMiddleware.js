// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map();

const rateLimitMiddleware = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const key = `${ip}:${req.originalUrl}`;
    
    // Get or create rate limit info for this IP + endpoint
    const rateLimitInfo = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };
    
    // Reset count if window has passed
    if (now > rateLimitInfo.resetTime) {
      rateLimitInfo.count = 0;
      rateLimitInfo.resetTime = now + windowMs;
    }
    
    // Increment request count
    rateLimitInfo.count++;
    rateLimitMap.set(key, rateLimitInfo);
    
    // Check if limit exceeded
    if (rateLimitInfo.count > maxRequests) {
      const retryAfter = Math.ceil((rateLimitInfo.resetTime - now) / 1000);
      return res.status(429).json({
        message: 'Too many requests, please try again later',
        retryAfter: retryAfter
      });
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - rateLimitInfo.count,
      'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toUTCString()
    });
    
    next();
  };
};

// Specific rate limiters for authentication endpoints
// More lenient settings for development
const authRateLimiter = rateLimitMiddleware(15 * 60 * 1000, 50); // 50 attempts per 15 minutes
const strictAuthRateLimiter = rateLimitMiddleware(60 * 60 * 1000, 30); // 30 attempts per hour

module.exports = {
  rateLimitMiddleware,
  authRateLimiter,
  strictAuthRateLimiter
};