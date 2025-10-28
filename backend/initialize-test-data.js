const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const Organization = require('./models/Organization');
const User = require('./models/User');
const sequelize = require('./config/database');

async function initializeTestData() {
  try {
    // Sync the models with a safer approach
    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully!');
    
    // Create test organizations
    console.log('Creating test organizations...');
    
    const org1 = await Organization.findOrCreate({
      where: { name: 'OSGB 1' },
      defaults: {
        name: 'OSGB 1',
        address: 'İstanbul, Türkiye',
        phone: '5551234567',
        email: 'info@osgb1.com.tr',
        taxNumber: '1234567890',
        taxOffice: 'İstanbul Vergi Dairesi',
        isActive: true
      }
    });
    
    const org2 = await Organization.findOrCreate({
      where: { name: 'OSGB 2' },
      defaults: {
        name: 'OSGB 2',
        address: 'Ankara, Türkiye',
        phone: '5559876543',
        email: 'info@osgb2.com.tr',
        taxNumber: '0987654321',
        taxOffice: 'Ankara Vergi Dairesi',
        isActive: true
      }
    });
    
    console.log('Organizations created/verified:');
    console.log('- OSGB 1:', org1[0].toJSON());
    console.log('- OSGB 2:', org2[0].toJSON());
    
    // Create test users
    console.log('Creating test users...');
    
    // Create admin user for OSGB 1
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('Admin123!@#', salt);
      
      await User.create({
        username: 'admin',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        organizationId: org1[0].id
      });
      console.log('Admin user created for OSGB 1');
    } else {
      // Update existing admin user to ensure it has organizationId
      await adminUser.update({ organizationId: org1[0].id });
      console.log('Admin user updated with organization ID');
    }
    
    // Create test user for OSGB 1
    const osgb1User = await User.findOne({ where: { username: 'osgb1' } });
    if (!osgb1User) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('osgb123', salt);
      
      await User.create({
        username: 'osgb1',
        password: hashedPassword,
        fullName: 'OSGB 1 User',
        role: 'admin',
        organizationId: org1[0].id
      });
      console.log('Test user "osgb1" created for OSGB 1');
    } else {
      // Update existing user to ensure it has organizationId
      await osgb1User.update({ organizationId: org1[0].id });
      console.log('Test user "osgb1" updated with organization ID');
    }
    
    // Create test user for OSGB 2
    const osgb2User = await User.findOne({ where: { username: 'osgb2' } });
    if (!osgb2User) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('osgb456', salt);
      
      await User.create({
        username: 'osgb2',
        password: hashedPassword,
        fullName: 'OSGB 2 User',
        role: 'admin',
        organizationId: org2[0].id
      });
      console.log('Test user "osgb2" created for OSGB 2');
    } else {
      // Update existing user to ensure it has organizationId
      await osgb2User.update({ organizationId: org2[0].id });
      console.log('Test user "osgb2" updated with organization ID');
    }
    
    console.log('Test data initialization completed successfully!');
    console.log('\nTest credentials:');
    console.log('- Admin: username "admin", password "Admin123!@#"');
    console.log('- OSGB 1 User: username "osgb1", password "osgb123"');
    console.log('- OSGB 2 User: username "osgb2", password "osgb456"');
    
  } catch (error) {
    console.error('Error initializing test data:', error);
  } finally {
    await sequelize.close();
  }
}

initializeTestData();