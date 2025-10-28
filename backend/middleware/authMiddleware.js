const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');

const authMiddleware = async (req, res, next) => {
  try {
    // First, try to get organization ID from JWT token
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'osgb_secret_key');
        
        // Add user info to request
        req.user = decoded;
        
        // If user has organization ID in token, use it
        if (decoded.organizationId) {
          req.organizationId = decoded.organizationId;
          const organization = await Organization.findByPk(decoded.organizationId);
          if (organization) {
            req.organization = organization;
          }
        }
      } catch (jwtError) {
        // JWT verification failed, continue with header-based organization ID
        console.log('JWT verification failed:', jwtError.message);
      }
    }
    
    // Fallback to header-based organization ID (for testing)
    const organizationId = req.headers['x-organization-id'];
    
    if (organizationId && !req.organizationId) {
      req.organizationId = parseInt(organizationId);
      const organization = await Organization.findByPk(organizationId);
      if (organization) {
        req.organization = organization;
      }
    }
    
    // If no organization ID found, check if user is admin
    if (!req.organizationId) {
      // If user is admin, allow access to all organizations
      if (req.user && req.user.role === 'admin') {
        // For admin users, we'll handle organization filtering in controllers
        // by not applying organization filter when user is admin
      } else {
        return res.status(400).json({ message: 'Organization ID is required' });
      }
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

module.exports = authMiddleware;