const request = require('supertest');
const express = require('express');
const expertController = require('../controllers/expertController');
const { sequelize, Expert, Organization } = require('./setup');

// Create express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = { organizationId: 1 };
  req.headers = { 'x-organization-id': 1 };
  next();
};

// Apply middleware and routes
app.use(mockAuthMiddleware);
app.get('/experts', expertController.getAllExperts);
app.get('/experts/:id', expertController.getExpertById);
app.post('/experts', expertController.createExpert);
app.put('/experts/:id', expertController.updateExpert);
app.delete('/experts/:id', expertController.deleteExpert);

describe('Expert Controller', () => {
  let testOrganization;
  let testExpert;

  beforeAll(async () => {
    // Create test organization
    testOrganization = await Organization.create({
      name: 'Test Organization',
      address: 'Test Address',
      phone: '5551234567'
    });

    // Create test expert
    testExpert = await Expert.create({
      firstName: 'John',
      lastName: 'Doe',
      phone: '5551234567',
      expertiseClass: 'A',
      assignedMinutes: 11900,
      organizationId: testOrganization.id
    });
  });

  describe('GET /experts', () => {
    it('should get all experts for the organization', async () => {
      const response = await request(app)
        .get('/experts')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('firstName', 'John');
      expect(response.body[0]).toHaveProperty('lastName', 'Doe');
    });

    it('should return 400 if organization ID is missing', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.get('/experts', expertController.getAllExperts);

      await request(appWithoutAuth)
        .get('/experts')
        .expect(400);
    });
  });

  describe('GET /experts/:id', () => {
    it('should get an expert by ID', async () => {
      const response = await request(app)
        .get(`/experts/${testExpert.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testExpert.id);
      expect(response.body).toHaveProperty('firstName', 'John');
      expect(response.body).toHaveProperty('lastName', 'Doe');
    });

    it('should return 404 for non-existent expert', async () => {
      await request(app)
        .get('/experts/99999')
        .expect(404);
    });

    it('should return 400 if organization ID is missing', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.get('/experts/1', expertController.getExpertById);

      await request(appWithoutAuth)
        .get('/experts/1')
        .expect(400);
    });
  });

  describe('POST /experts', () => {
    it('should create a new expert', async () => {
      const newExpert = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '5559876543',
        expertiseClass: 'B',
        assignedMinutes: 10000
      };

      const response = await request(app)
        .post('/experts')
        .send(newExpert)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('firstName', 'Jane');
      expect(response.body).toHaveProperty('lastName', 'Smith');
      expect(response.body).toHaveProperty('phone', '555 987 65 43');
      expect(response.body).toHaveProperty('expertiseClass', 'B');
      expect(response.body).toHaveProperty('assignedMinutes', 10000);
    });

    it('should return 400 for invalid expert data', async () => {
      const invalidExpert = {
        firstName: '', // Empty first name
        lastName: 'Smith',
        phone: '5559876543',
        expertiseClass: 'B'
      };

      await request(app)
        .post('/experts')
        .send(invalidExpert)
        .expect(400);
    });

    it('should return 400 if assigned minutes exceed limit', async () => {
      const invalidExpert = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '5559876543',
        expertiseClass: 'B',
        assignedMinutes: 15000 // Exceeds limit of 11900
      };

      await request(app)
        .post('/experts')
        .send(invalidExpert)
        .expect(400);
    });

    it('should return 400 if organization ID is missing', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.post('/experts', expertController.createExpert);

      const newExpert = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '5559876543',
        expertiseClass: 'B'
      };

      await request(appWithoutAuth)
        .post('/experts')
        .send(newExpert)
        .expect(400);
    });
  });

  describe('PUT /experts/:id', () => {
    it('should update an existing expert', async () => {
      const updatedData = {
        firstName: 'John',
        lastName: 'Updated',
        phone: '5551112233',
        expertiseClass: 'C',
        assignedMinutes: 9000
      };

      const response = await request(app)
        .put(`/experts/${testExpert.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('firstName', 'John');
      expect(response.body).toHaveProperty('lastName', 'Updated');
      expect(response.body).toHaveProperty('phone', '555 111 22 33');
      expect(response.body).toHaveProperty('expertiseClass', 'C');
      expect(response.body).toHaveProperty('assignedMinutes', 9000);
    });

    it('should return 404 for non-existent expert', async () => {
      await request(app)
        .put('/experts/99999')
        .send({ firstName: 'Updated' })
        .expect(404);
    });

    it('should return 400 for invalid update data', async () => {
      await request(app)
        .put(`/experts/${testExpert.id}`)
        .send({ assignedMinutes: 15000 }) // Exceeds limit
        .expect(400);
    });
  });

  describe('DELETE /experts/:id', () => {
    it('should delete an existing expert', async () => {
      // Create a new expert to delete
      const expertToDelete = await Expert.create({
        firstName: 'ToDelete',
        lastName: 'Expert',
        phone: '5551112233',
        expertiseClass: 'A',
        assignedMinutes: 11900,
        organizationId: testOrganization.id
      });

      await request(app)
        .delete(`/experts/${expertToDelete.id}`)
        .expect(200);

      // Verify expert is deleted
      await request(app)
        .get(`/experts/${expertToDelete.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent expert', async () => {
      await request(app)
        .delete('/experts/99999')
        .expect(404);
    });
  });
});