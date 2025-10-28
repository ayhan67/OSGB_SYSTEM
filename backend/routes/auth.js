const express = require('express');
const authController = require('../controllers/authController');
const jwtAuthMiddleware = require('../middleware/jwtAuthMiddleware');
const { authRateLimiter, strictAuthRateLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// OSGB self-registration (public endpoint)
router.post('/register-organization', authRateLimiter, authController.registerOrganization);

// User registration with enhanced security and rate limiting
router.post('/register', authRateLimiter, authController.registerUser);

// User login with enhanced security and strict rate limiting
router.post('/login', strictAuthRateLimiter, authController.loginUser);

// Get current user profile (protected route)
router.get('/me', jwtAuthMiddleware, authController.getCurrentUser);

// Update user profile (protected route)
router.put('/me', jwtAuthMiddleware, authController.updateUser);

module.exports = router;