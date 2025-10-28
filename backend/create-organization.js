const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const Organization = require('./models/Organization');
const User = require('./models/User');
const sequelize = require('./config/database');

async function createOrganizations() {
  try {
    // Sync the models
    await sequelize.sync();
    console.log('Database synced successfully!');
    
    // Create organizations
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
    
    // Update users to assign them to organizations
    // osgb1 user -> OSGB 1
    const osgb1User = await User.findOne({ where: { username: 'osgb1' } });
    if (osgb1User) {
      await osgb1User.update({ organizationId: org1[0].id });
      console.log('User "osgb1" assigned to organization "OSGB 1"');
    }
    
    // osgb2 user -> OSGB 2
    const osgb2User = await User.findOne({ where: { username: 'osgb2' } });
    if (osgb2User) {
      await osgb2User.update({ organizationId: org2[0].id });
      console.log('User "osgb2" assigned to organization "OSGB 2"');
    }
    
    // admin user -> OSGB 1 (default)
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      await adminUser.update({ organizationId: org1[0].id });
      console.log('User "admin" assigned to organization "OSGB 1"');
    }
    
  } catch (error) {
    console.error('Error creating organizations:', error);
  } finally {
    await sequelize.close();
  }
}

createOrganizations();