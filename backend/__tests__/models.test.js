const { sequelize, Expert, Doctor, Dsp, Workplace, Visit, Organization, User } = require('./setup');

describe('Models', () => {
  describe('Organization', () => {
    it('should create an organization with valid data', async () => {
      const organization = await Organization.create({
        name: 'Test Organization',
        address: '123 Test Street',
        phone: '5551234567'
      });

      expect(organization).toHaveProperty('id');
      expect(organization).toHaveProperty('name', 'Test Organization');
      expect(organization).toHaveProperty('address', '123 Test Street');
      expect(organization).toHaveProperty('phone', '5551234567');
    });

    it('should not create an organization without required fields', async () => {
      await expect(
        Organization.create({
          // Missing required fields
        })
      ).rejects.toThrow();
    });
  });

  describe('Expert', () => {
    let testOrganization;

    beforeAll(async () => {
      testOrganization = await Organization.create({
        name: 'Test Organization',
        address: 'Test Address',
        phone: '5551234567'
      });
    });

    it('should create an expert with valid data', async () => {
      const expert = await Expert.create({
        firstName: 'John',
        lastName: 'Doe',
        phone: '5551234567',
        expertiseClass: 'A',
        assignedMinutes: 11900,
        organizationId: testOrganization.id
      });

      expect(expert).toHaveProperty('id');
      expect(expert).toHaveProperty('firstName', 'John');
      expect(expert).toHaveProperty('lastName', 'Doe');
      expect(expert).toHaveProperty('phone', '5551234567');
      expect(expert).toHaveProperty('expertiseClass', 'A');
      expect(expert).toHaveProperty('assignedMinutes', 11900);
      expect(expert).toHaveProperty('organizationId', testOrganization.id);
    });

    it('should validate phone number format', async () => {
      await expect(
        Expert.create({
          firstName: 'John',
          lastName: 'Doe',
          phone: 'invalid-phone', // Invalid format
          expertiseClass: 'A',
          assignedMinutes: 11900,
          organizationId: testOrganization.id
        })
      ).rejects.toThrow();
    });

    it('should validate assigned minutes limit', async () => {
      await expect(
        Expert.create({
          firstName: 'John',
          lastName: 'Doe',
          phone: '5551234567',
          expertiseClass: 'A',
          assignedMinutes: 15000, // Exceeds limit of 11900
          organizationId: testOrganization.id
        })
      ).rejects.toThrow();
    });
  });

  describe('Workplace', () => {
    let testOrganization;
    let testExpert;
    let testDoctor;
    let testDsp;

    beforeAll(async () => {
      testOrganization = await Organization.create({
        name: 'Test Organization',
        address: 'Test Address',
        phone: '5551234567'
      });

      testExpert = await Expert.create({
        firstName: 'John',
        lastName: 'Expert',
        phone: '5551234567',
        expertiseClass: 'A',
        assignedMinutes: 11900,
        organizationId: testOrganization.id
      });

      testDoctor = await Doctor.create({
        firstName: 'Jane',
        lastName: 'Doctor',
        phone: '5551234568',
        expertiseClass: 'A',
        assignedMinutes: 11900,
        organizationId: testOrganization.id
      });

      testDsp = await Dsp.create({
        firstName: 'Bob',
        lastName: 'Dsp',
        phone: '5551234569',
        expertiseClass: 'A',
        assignedMinutes: 11900,
        organizationId: testOrganization.id
      });
    });

    it('should create a workplace with valid data', async () => {
      const workplace = await Workplace.create({
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
        assignedDspId: testDsp.id,
        organizationId: testOrganization.id
      });

      expect(workplace).toHaveProperty('id');
      expect(workplace).toHaveProperty('name', 'Test Workplace');
      expect(workplace).toHaveProperty('riskLevel', 'low');
      expect(workplace).toHaveProperty('employeeCount', 50);
    });

    it('should validate required fields', async () => {
      await expect(
        Workplace.create({
          // Missing required fields
        })
      ).rejects.toThrow();
    });

    it('should validate risk level values', async () => {
      await expect(
        Workplace.create({
          name: 'Test Workplace',
          address: '123 Test Street',
          sskRegistrationNo: '1234567890',
          taxOffice: 'Test Tax Office',
          taxNumber: '1234567890',
          price: 1000.00,
          riskLevel: 'invalid', // Invalid risk level
          employeeCount: 50,
          organizationId: testOrganization.id
        })
      ).rejects.toThrow();
    });
  });

  describe('Visit', () => {
    let testOrganization;
    let testExpert;
    let testWorkplace;

    beforeAll(async () => {
      testOrganization = await Organization.create({
        name: 'Test Organization',
        address: 'Test Address',
        phone: '5551234567'
      });

      testExpert = await Expert.create({
        firstName: 'John',
        lastName: 'Expert',
        phone: '5551234567',
        expertiseClass: 'A',
        assignedMinutes: 11900,
        organizationId: testOrganization.id
      });

      testWorkplace = await Workplace.create({
        name: 'Test Workplace',
        address: '123 Test Street',
        sskRegistrationNo: '1234567890',
        taxOffice: 'Test Tax Office',
        taxNumber: '1234567890',
        price: 1000.00,
        riskLevel: 'low',
        employeeCount: 50,
        organizationId: testOrganization.id
      });
    });

    it('should create a visit with valid data', async () => {
      const visit = await Visit.create({
        expertId: testExpert.id,
        workplaceId: testWorkplace.id,
        visitMonth: '2023-07',
        visited: true,
        visitDate: new Date(),
        organizationId: testOrganization.id
      });

      expect(visit).toHaveProperty('id');
      expect(visit).toHaveProperty('visitMonth', '2023-07');
      expect(visit).toHaveProperty('visited', true);
    });

    it('should validate required fields', async () => {
      await expect(
        Visit.create({
          // Missing required fields
        })
      ).rejects.toThrow();
    });
  });

  describe('User', () => {
    let testOrganization;

    beforeAll(async () => {
      testOrganization = await Organization.create({
        name: 'Test Organization',
        address: 'Test Address',
        phone: '5551234567'
      });
    });

    it('should create a user with valid data', async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'hashedpassword',
        fullName: 'Test User',
        role: 'admin',
        organizationId: testOrganization.id
      });

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', 'testuser');
      expect(user).toHaveProperty('fullName', 'Test User');
      expect(user).toHaveProperty('role', 'admin');
    });

    it('should validate required fields', async () => {
      await expect(
        User.create({
          // Missing required fields
        })
      ).rejects.toThrow();
    });

    it('should validate role values', async () => {
      await expect(
        User.create({
          username: 'testuser',
          password: 'hashedpassword',
          fullName: 'Test User',
          role: 'invalid', // Invalid role
          organizationId: testOrganization.id
        })
      ).rejects.toThrow();
    });
  });
});