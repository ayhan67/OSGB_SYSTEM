const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const sequelize = require('./config/database');

async function testLogin() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models
    await sequelize.sync({ force: false });
    
    // Test admin user login
    console.log('\nTesting admin user login...');
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      console.log('Admin user found in database');
      console.log('- Username:', adminUser.username);
      console.log('- Password hash:', adminUser.password);
      console.log('- Role:', adminUser.role);
      console.log('- Organization ID:', adminUser.organizationId);
      
      // Test password verification
      const isMatch = await bcrypt.compare('Admin123!@#', adminUser.password);
      console.log('- Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
      
      // Test JWT token generation
      if (isMatch) {
        const token = jwt.sign(
          { 
            id: adminUser.id, 
            username: adminUser.username, 
            role: adminUser.role,
            organizationId: adminUser.organizationId
          },
          process.env.JWT_SECRET || 'osgb_secret_key',
          { 
            expiresIn: '8h',
            issuer: 'OSGB-System',
            audience: 'OSGB-Client'
          }
        );
        console.log('- JWT Token generated successfully');
        console.log('- Token:', token);
      }
    } else {
      console.log('Admin user NOT found in database');
    }
    
    // Test osgb1 user login
    console.log('\nTesting osgb1 user login...');
    const osgb1User = await User.findOne({ where: { username: 'osgb1' } });
    if (osgb1User) {
      console.log('OSGB1 user found in database');
      console.log('- Username:', osgb1User.username);
      console.log('- Password hash:', osgb1User.password);
      console.log('- Role:', osgb1User.role);
      console.log('- Organization ID:', osgb1User.organizationId);
      
      // Test password verification
      const isMatch = await bcrypt.compare('osgb123', osgb1User.password);
      console.log('- Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('OSGB1 user NOT found in database');
    }
    
    // Test osgb2 user login
    console.log('\nTesting osgb2 user login...');
    const osgb2User = await User.findOne({ where: { username: 'osgb2' } });
    if (osgb2User) {
      console.log('OSGB2 user found in database');
      console.log('- Username:', osgb2User.username);
      console.log('- Password hash:', osgb2User.password);
      console.log('- Role:', osgb2User.role);
      console.log('- Organization ID:', osgb2User.organizationId);
      
      // Test password verification
      const isMatch = await bcrypt.compare('osgb456', osgb2User.password);
      console.log('- Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('OSGB2 user NOT found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

testLogin();