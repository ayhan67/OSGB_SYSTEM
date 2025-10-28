const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('../routes/auth');
const { sequelize, User, Organization } = require('./setup');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication', () => {
  let testOrganization;
  let testUser;
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    // Create test organization
    testOrganization = await Organization.create({
      name: 'Test Organization',
      address: 'Test Address',
      phone: '5551234567'
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      password: hashedPassword,
      fullName: 'Test User',
      role: 'admin',
      organizationId: testOrganization.id
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: testPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('fullName', 'Test User');
      expect(response.body.user).toHaveProperty('role', 'admin');
    });

    it('should return 401 for invalid password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should return 401 for non-existent user', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password'
        })
        .expect(401);
    });

    it('should return 400 for missing credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
          // Missing password
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'newpassword123',
          fullName: 'New User'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'newuser');
      expect(response.body.user).toHaveProperty('fullName', 'New User');
      expect(response.body.user).toHaveProperty('role', 'user'); // Default role
    });

    it('should return 400 for missing registration data', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'incompleteuser'
          // Missing password and fullName
        })
        .expect(400);
    });

    it('should return 400 for duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser', // Already exists
          password: 'newpassword123',
          fullName: 'Duplicate User'
        })
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: testPassword
        });

      const token = loginResponse.body.token;

      // Use token to get profile
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('fullName', 'Test User');
      expect(response.body).toHaveProperty('role', 'admin');
    });

    it('should return 401 for invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });

    it('should return 401 for missing token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });
});