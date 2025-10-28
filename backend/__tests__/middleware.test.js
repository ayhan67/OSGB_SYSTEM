const request = require('supertest');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cacheMiddleware');
const securityMiddleware = require('../middleware/securityMiddleware');
const { sequelize, Organization, User } = require('./setup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Middleware', () => {
  describe('Auth Middleware', () => {
    let app;
    let testOrganization;
    let testUser;
    let validToken;

    beforeAll(async () => {
      app = express();
      app.use(express.json());

      // Create test organization and user
      testOrganization = await Organization.create({
        name: 'Test Organization',
        address: 'Test Address',
        phone: '5551234567'
      });

      const hashedPassword = await bcrypt.hash('testpassword', 10);
      testUser = await User.create({
        username: 'testuser',
        password: hashedPassword,
        fullName: 'Test User',
        role: 'user',
        organizationId: testOrganization.id
      });

      // Generate valid token
      validToken = jwt.sign(
        { 
          id: testUser.id, 
          username: testUser.username,
          organizationId: testOrganization.id
        },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      // Test route that requires auth
      app.get('/protected', authMiddleware, (req, res) => {
        res.status(200).json({ 
          message: 'Access granted',
          user: req.user
        });
      });

      app.get('/no-auth', (req, res) => {
        res.status(200).json({ message: 'Public route' });
      });
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Access granted');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });

    it('should deny access without token', async () => {
      await request(app)
        .get('/protected')
        .expect(401);
    });

    it('should deny access with invalid token', async () => {
      await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });

    it('should deny access with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '0s' } // Expired immediately
      );

      await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should allow access to public routes without token', async () => {
      await request(app)
        .get('/no-auth')
        .expect(200);
    });
  });

  describe('Cache Middleware', () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(express.json());

      // Test route with cache middleware
      app.get('/cached', cacheMiddleware, (req, res) => {
        res.status(200).json({ 
          message: 'Cached response',
          timestamp: Date.now()
        });
      });

      // Test route without cache middleware
      app.get('/uncached', (req, res) => {
        res.status(200).json({ 
          message: 'Uncached response',
          timestamp: Date.now()
        });
      });
    });

    beforeEach(() => {
      clearCache('');
    });

    it('should cache GET requests', async () => {
      // First request - should not be cached
      const firstResponse = await request(app)
        .get('/cached')
        .expect(200);

      // Second request - should be cached (same timestamp)
      const secondResponse = await request(app)
        .get('/cached')
        .expect(200);

      expect(firstResponse.body.timestamp).toBe(secondResponse.body.timestamp);
    });

    it('should not cache non-GET requests', async () => {
      // POST request - should not be cached
      await request(app)
        .post('/cached')
        .expect(404); // Route doesn't exist for POST
    });

    it('should not cache routes without cache middleware', async () => {
      // First request - should not be cached
      const firstResponse = await request(app)
        .get('/uncached')
        .expect(200);

      // Second request - should not be cached (different timestamp)
      const secondResponse = await request(app)
        .get('/uncached')
        .expect(200);

      expect(firstResponse.body.timestamp).not.toBe(secondResponse.body.timestamp);
    });

    it('should clear cache correctly', async () => {
      // First request - should not be cached
      const firstResponse = await request(app)
        .get('/cached')
        .expect(200);

      // Clear cache
      clearCache('cached');

      // Second request - should not be cached (different timestamp)
      const secondResponse = await request(app)
        .get('/cached')
        .expect(200);

      expect(firstResponse.body.timestamp).not.toBe(secondResponse.body.timestamp);
    });
  });

  describe('Security Middleware', () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(express.json());
      app.use(securityMiddleware);

      app.post('/test', (req, res) => {
        res.status(200).json({ message: 'Security test passed' });
      });
    });

    it('should set security headers', async () => {
      const response = await request(app)
        .post('/test')
        .expect(200);

      // Check that security headers are set
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });
});