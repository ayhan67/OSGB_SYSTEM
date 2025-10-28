const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwtAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    // Check if token exists
    if (!authHeader) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Check if token is in Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Extract token
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'osgb_secret_key');
    
    // Add user to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

module.exports = jwtAuthMiddleware;