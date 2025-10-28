const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const { sequelize, Expert, Doctor, Dsp, Workplace, Visit, Organization, User } = require('./setup');

// Import all routes
const authRoutes = require('../routes/auth');
const expertRoutes = require('../routes/experts');
const doctorRoutes = require('../routes/doctors');
const dspRoutes = require('../routes/dsps');
const workplaceRoutes = require('../routes/workplaces');
const visitsRoutes = require('../routes/visits');

// Create express app for integration testing
const app = express();
app.use(express.json());

// Mount all routes
app.use('/api/auth', authRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/dsps', dspRoutes);
app.use('/api/workplaces', workplaceRoutes);
app.use('/api/visits', visitsRoutes);

describe('Integration Tests', () => {
  let testOrganization;
  let adminUser;
  let adminToken;
  let testExpert;
  let testDoctor;
  let testDsp;

  beforeAll(async () => {
    // Create test organization
    testOrganization = await Organization.create({
      name: 'Test Organization',
      address: 'Test Address',
      phone: '5551234567'
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'admin',
      organizationId: testOrganization.id
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    adminToken = loginResponse.body.token;
  });

  describe('User Authentication Flow', () => {
    it('should register a new user and login', async () => {
      // Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'newuser123',
          fullName: 'New User'
        })
        .expect(200);

      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user).toHaveProperty('username', 'newuser');

      // Login with new user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'newuser',
          password: 'newuser123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user).toHaveProperty('username', 'newuser');
    });
  });

  describe('Expert Management Flow', () => {
    it('should create, retrieve, update, and delete an expert', async () => {
      // Create expert
      const createResponse = await request(app)
        .post('/api/experts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'John',
          lastName: 'Expert',
          phone: '5551234567',
          expertiseClass: 'A',
          assignedMinutes: 11900
        })
        .expect(201);

      const expertId = createResponse.body.id;
      expect(createResponse.body).toHaveProperty('firstName', 'John');
      expect(createResponse.body).toHaveProperty('lastName', 'Expert');

      // Retrieve expert
      const getResponse = await request(app)
        .get(`/api/experts/${expertId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', expertId);
      expect(getResponse.body).toHaveProperty('firstName', 'John');

      // Update expert
      const updateResponse = await request(app)
        .put(`/api/experts/${expertId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'John',
          lastName: 'Updated Expert',
          phone: '5551234567',
          expertiseClass: 'B',
          assignedMinutes: 10000
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('lastName', 'Updated Expert');
      expect(updateResponse.body).toHaveProperty('expertiseClass', 'B');

      // List all experts
      const listResponse = await request(app)
        .get('/api/experts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body).toBeInstanceOf(Array);
      expect(listResponse.body.length).toBeGreaterThan(0);

      // Delete expert
      await request(app)
        .delete(`/api/experts/${expertId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify expert is deleted
      await request(app)
        .get(`/api/experts/${expertId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Workplace Management Flow', () => {
    beforeAll(async () => {
      // Create test personnel for workplace assignment
      const expertResponse = await request(app)
        .post('/api/experts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Expert',
          phone: '5551234568',
          expertiseClass: 'A',
          assignedMinutes: 11900
        });

      testExpert = expertResponse.body;

      const doctorResponse = await request(app)
        .post('/api/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Doctor',
          phone: '5551234569',
          expertiseClass: 'A',
          assignedMinutes: 11900
        });

      testDoctor = doctorResponse.body;

      const dspResponse = await request(app)
        .post('/api/dsps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'DSP',
          phone: '5551234570',
          expertiseClass: 'A',
          assignedMinutes: 11900
        });

      testDsp = dspResponse.body;
    });

    it('should create, retrieve, update, and delete a workplace', async () => {
      // Create workplace
      const createResponse = await request(app)
        .post('/api/workplaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Workplace',
          address: '123 Test Street',
          sskRegistrationNo: '1234567890',
          taxOffice: 'Test Tax Office',
          taxNumber: '1234567890',
          price: 1000.00,
          riskLevel: 'low',
          employeeCount: 50,
          assignedExpertId: testExpert.id,
          assignedDoctorId: testDoctor.id,
          assignedDspId: testDsp.id
        })
        .expect(201);

      const workplaceId = createResponse.body.id;
      expect(createResponse.body).toHaveProperty('name', 'Test Workplace');

      // Retrieve workplace
      const getResponse = await request(app)
        .get(`/api/workplaces/${workplaceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', workplaceId);
      expect(getResponse.body).toHaveProperty('name', 'Test Workplace');

      // Update workplace
      const updateResponse = await request(app)
        .put(`/api/workplaces/${workplaceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Workplace',
          employeeCount: 75,
          riskLevel: 'dangerous'
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('name', 'Updated Workplace');
      expect(updateResponse.body).toHaveProperty('employeeCount', 75);
      expect(updateResponse.body).toHaveProperty('riskLevel', 'dangerous');

      // List all workplaces
      const listResponse = await request(app)
        .get('/api/workplaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body).toBeInstanceOf(Array);
      expect(listResponse.body.length).toBeGreaterThan(0);

      // Delete workplace
      await request(app)
        .delete(`/api/workplaces/${workplaceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify workplace is deleted
      await request(app)
        .get(`/api/workplaces/${workplaceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Visit Management Flow', () => {
    let testWorkplace;
    let testVisit;

    beforeAll(async () => {
      // Create a workplace for visit testing
      const workplaceResponse = await request(app)
        .post('/api/workplaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Visit Test Workplace',
          address: '456 Visit Street',
          sskRegistrationNo: '0987654321',
          taxOffice: 'Visit Tax Office',
          taxNumber: '0987654321',
          price: 1500.00,
          riskLevel: 'low',
          employeeCount: 25,
          assignedExpertId: testExpert.id,
          assignedDoctorId: testDoctor.id,
          assignedDspId: testDsp.id
        });

      testWorkplace = workplaceResponse.body;
    });

    it('should create and update visit status', async () => {
      // Create visit status
      const createResponse = await request(app)
        .post(`/api/visits/experts/${testExpert.id}/workplaces/${testWorkplace.id}/visits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          visitMonth: '2023-07',
          visited: true,
          visitDate: new Date().toISOString()
        })
        .expect(200);

      expect(createResponse.body).toHaveProperty('message', 'Visit status updated successfully');

      // Get expert visits
      const getResponse = await request(app)
        .get(`/api/experts/${testExpert.id}/visit-summary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty(testWorkplace.id);
      expect(getResponse.body[testWorkplace.id]).toHaveProperty('visits');
      expect(getResponse.body[testWorkplace.id].visits).toHaveProperty('2023-07');
    });
  });
});