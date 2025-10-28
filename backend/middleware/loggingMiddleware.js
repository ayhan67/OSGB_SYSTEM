const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const securityLogStream = fs.createWriteStream(path.join(logsDir, 'security.log'), { flags: 'a' });

const loggingMiddleware = (req, res, next) => {
  // Log security-related events
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    organizationId: req.organizationId || null
  };

  // Log authentication events
  if (req.originalUrl.includes('/auth/login') || req.originalUrl.includes('/auth/register')) {
    securityLogStream.write(JSON.stringify(logEntry) + '\n');
  }

  // Log sensitive operations
  if (req.method === 'DELETE' || 
      (req.method === 'POST' && req.originalUrl.includes('/users')) ||
      (req.method === 'PUT' && req.originalUrl.includes('/users'))) {
    securityLogStream.write(JSON.stringify(logEntry) + '\n');
  }

  next();
};

module.exports = loggingMiddleware;