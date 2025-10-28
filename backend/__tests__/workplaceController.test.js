const request = require('supertest');
const express = require('express');
const workplaceController = require('../controllers/workplaceController');
const { sequelize, Expert, Doctor, Dsp, Workplace, Organization } = require('./setup');

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
app.get('/workplaces', workplaceController.getAllWorkplaces);
app.get('/workplaces/:id', workplaceController.getWorkplaceById);
app.post('/workplaces', workplaceController.createWorkplace);
app.put('/workplaces/:id', workplaceController.updateWorkplace);
app.delete('/workplaces/:id', workplaceController.deleteWorkplace);

describe('Workplace Controller', () => {
  let testOrganization;
  let testExpert;
  let testDoctor;
  let testDsp;
  let testWorkplace;

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
      lastName: 'Expert',
      phone: '5551234567',
      expertiseClass: 'A',
      assignedMinutes: 11900,
      organizationId: testOrganization.id
    });

    // Create test doctor
    testDoctor = await Doctor.create({
      firstName: 'Jane',
      lastName: 'Doctor',
      phone: '5551234568',
      expertiseClass: 'A',
      assignedMinutes: 11900,
      organizationId: testOrganization.id
    });

    // Create test DSP
    testDsp = await Dsp.create({
      firstName: 'Bob',
      lastName: 'Dsp',
      phone: '5551234569',
      expertiseClass: 'A',
      assignedMinutes: 11900,
      organizationId: testOrganization.id
    });

    // Create test workplace
    testWorkplace = await Workplace.create({
      name: 'Test Workplace',
      address: 'Test Address',
      sskRegistrationNo: '1234567890',
      taxOffice: 'Test Tax Office',
      taxNumber: '1234567890',
      price: 1000.00,
      riskLevel: 'low',
      employeeCount: 50,
      assignedExpertId: testExpert.id,
      assignedDoctorId: testDoctor.id,
      assignedDspId: testDsp.id,
      organizationId: testOrganization.id
    });
  });

  describe('GET /workplaces', () => {
    it('should get all workplaces for the organization', async () => {
      const response = await request(app)
        .get('/workplaces')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name', 'Test Workplace');
      expect(response.body[0]).toHaveProperty('address', 'Test Address');
    });

    it('should return 400 if organization ID is missing', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.get('/workplaces', workplaceController.getAllWorkplaces);

      await request(appWithoutAuth)
        .get('/workplaces')
        .expect(400);
    });
  });

  describe('GET /workplaces/:id', () => {
    it('should get a workplace by ID', async () => {
      const response = await request(app)
        .get(`/workplaces/${testWorkplace.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testWorkplace.id);
      expect(response.body).toHaveProperty('name', 'Test Workplace');
      expect(response.body).toHaveProperty('address', 'Test Address');
    });

    it('should return 404 for non-existent workplace', async () => {
      await request(app)
        .get('/workplaces/99999')
        .expect(404);
    });
  });

  describe('POST /workplaces', () => {
    it('should create a new workplace', async () => {
      const newWorkplace = {
        name: 'New Workplace',
        address: 'New Address',
        sskRegistrationNo: '0987654321',
        taxOffice: 'New Tax Office',
        taxNumber: '0987654321',
        price: 2000.00,
        riskLevel: 'dangerous',
        employeeCount: 100,
        assignedExpertId: testExpert.id,
        assignedDoctorId: testDoctor.id,
        assignedDspId: testDsp.id
      };

      const response = await request(app)
        .post('/workplaces')
        .send(newWorkplace)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'New Workplace');
      expect(response.body).toHaveProperty('address', 'New Address');
      expect(response.body).toHaveProperty('riskLevel', 'dangerous');
      expect(response.body).toHaveProperty('employeeCount', 100);
    });

    it('should return 400 for invalid workplace data', async () => {
      const invalidWorkplace = {
        name: '', // Empty name
        address: 'New Address',
        sskRegistrationNo: '0987654321',
        taxOffice: 'New Tax Office',
        taxNumber: '0987654321',
        price: 2000.00,
        riskLevel: 'dangerous',
        employeeCount: 100
      };

      await request(app)
        .post('/workplaces')
        .send(invalidWorkplace)
        .expect(400);
    });

    it('should return 400 if assigned expert is not in the same organization', async () => {
      // Create expert in different organization
      const differentOrg = await Organization.create({
        name: 'Different Org',
        address: 'Different Address',
        phone: '5551234570'
      });

      const differentExpert = await Expert.create({
        firstName: 'Different',
        lastName: 'Expert',
        phone: '5551234571',
        expertiseClass: 'A',
        assignedMinutes: 11900,
        organizationId: differentOrg.id
      });

      const newWorkplace = {
        name: 'New Workplace',
        address: 'New Address',
        sskRegistrationNo: '0987654321',
        taxOffice: 'New Tax Office',
        taxNumber: '0987654321',
        price: 2000.00,
        riskLevel: 'dangerous',
        employeeCount: 100,
        assignedExpertId: differentExpert.id // Expert from different org
      };

      await request(app)
        .post('/workplaces')
        .send(newWorkplace)
        .expect(400);
    });
  });

  describe('PUT /workplaces/:id', () => {
    it('should update an existing workplace', async () => {
      const updatedData = {
        name: 'Updated Workplace',
        address: 'Updated Address',
        riskLevel: 'veryDangerous',
        employeeCount: 150
      };

      const response = await request(app)
        .put(`/workplaces/${testWorkplace.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Workplace');
      expect(response.body).toHaveProperty('address', 'Updated Address');
      expect(response.body).toHaveProperty('riskLevel', 'veryDangerous');
      expect(response.body).toHaveProperty('employeeCount', 150);
    });

    it('should return 404 for non-existent workplace', async () => {
      await request(app)
        .put('/workplaces/99999')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /workplaces/:id', () => {
    it('should delete an existing workplace', async () => {
      // Create a new workplace to delete
      const workplaceToDelete = await Workplace.create({
        name: 'ToDelete Workplace',
        address: 'ToDelete Address',
        sskRegistrationNo: '1111111111',
        taxOffice: 'ToDelete Tax Office',
        taxNumber: '1111111111',
        price: 1500.00,
        riskLevel: 'low',
        employeeCount: 75,
        assignedExpertId: testExpert.id,
        assignedDoctorId: testDoctor.id,
        assignedDspId: testDsp.id,
        organizationId: testOrganization.id
      });

      await request(app)
        .delete(`/workplaces/${workplaceToDelete.id}`)
        .expect(200);

      // Verify workplace is deleted
      await request(app)
        .get(`/workplaces/${workplaceToDelete.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent workplace', async () => {
      await request(app)
        .delete('/workplaces/99999')
        .expect(404);
    });
  });
});