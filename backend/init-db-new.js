const { sequelize, Expert, Doctor, Dsp, Workplace, Visit, Organization, User } = require('./models/index');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    // Sync all models to the database
    await sequelize.sync({ force: true }); // This will drop existing tables and recreate them
    console.log('Database initialized successfully!');
    
    // Create a sample organization
    const organization = await Organization.create({
      name: 'Test OSGB',
      address: 'İstanbul, Türkiye',
      phone: '5551112233',
      email: 'info@testosgb.com',
      taxNumber: '1112223334',
      taxOffice: 'Kadıköy'
    });
    console.log('Sample organization created:', organization.toJSON());
    
    // Create a sample admin user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin123!@#', salt);
    
    const adminUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'admin',
      organizationId: organization.id
    });
    console.log('Sample admin user created:', adminUser.toJSON());
    
    // Create some sample data for testing
    const expert = await Expert.create({
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phone: '5551234567',
      expertiseClass: 'A',
      assignedMinutes: 11900,
      organizationId: organization.id
    });
    console.log('Sample expert created:', expert.toJSON());
    
    const doctor = await Doctor.create({
      firstName: 'Mehmet',
      lastName: 'Kaya',
      phone: '5559876543',
      organizationId: organization.id
    });
    console.log('Sample doctor created:', doctor.toJSON());
    
    const dsp = await Dsp.create({
      firstName: 'Ayşe',
      lastName: 'Demir',
      phone: '5554567890',
      organizationId: organization.id
    });
    console.log('Sample DSP created:', dsp.toJSON());
    
    const workplace = await Workplace.create({
      name: 'Test İş Yeri',
      address: 'İstanbul, Türkiye',
      sskRegistrationNo: '1234567890',
      taxOffice: 'Kadıköy',
      taxNumber: '9876543210',
      price: 10000.00,
      riskLevel: 'low',
      employeeCount: 50,
      assignedExpertId: expert.id,
      assignedDoctorId: doctor.id,
      assignedDspId: dsp.id,
      source: 'Referans',
      approvalStatus: 'onaylandi',
      organizationId: organization.id
    });
    console.log('Sample workplace created:', workplace.toJSON());
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await sequelize.close();
  }
}

initializeDatabase();