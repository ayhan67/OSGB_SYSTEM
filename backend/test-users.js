const User = require('./models/User');
const Organization = require('./models/Organization');
const sequelize = require('./config/database');

async function testUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models
    await sequelize.sync({ force: false });
    
    // Get all users
    const users = await User.findAll();
    
    console.log('Users in database:');
    for (const user of users) {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Org ID: ${user.organizationId}`);
      
      // Get organization name if organizationId exists
      if (user.organizationId) {
        const org = await Organization.findByPk(user.organizationId);
        if (org) {
          console.log(`  Organization: ${org.name}`);
        }
      }
    }
    
    // Check specific users
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      console.log('\nAdmin user found:');
      console.log(`- Username: ${adminUser.username}`);
      console.log(`- Role: ${adminUser.role}`);
      console.log(`- Organization ID: ${adminUser.organizationId}`);
    } else {
      console.log('\nAdmin user not found');
    }
    
    const osgb1User = await User.findOne({ where: { username: 'osgb1' } });
    if (osgb1User) {
      console.log('\nOSGB1 user found:');
      console.log(`- Username: ${osgb1User.username}`);
      console.log(`- Role: ${osgb1User.role}`);
      console.log(`- Organization ID: ${osgb1User.organizationId}`);
    } else {
      console.log('\nOSGB1 user not found');
    }
    
    const osgb2User = await User.findOne({ where: { username: 'osgb2' } });
    if (osgb2User) {
      console.log('\nOSGB2 user found:');
      console.log(`- Username: ${osgb2User.username}`);
      console.log(`- Role: ${osgb2User.role}`);
      console.log(`- Organization ID: ${osgb2User.organizationId}`);
    } else {
      console.log('\nOSGB2 user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

testUsers();