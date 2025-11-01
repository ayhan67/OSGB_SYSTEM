const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
// Load environment variables
dotenv.config();

// Import database connection - this will use SQLite since DB_DIALECT=sqlite is in .env
const sequelize = require('./config/database');
const Organization = require('./models/Organization');
const User = require('./models/User');

async function initDatabase() {
  try {
    console.log('Initializing database with test data...');
    
    // Test the connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync the models with a safer approach
    console.log('Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully!');
    
    // Create a test organization
    console.log('Creating test organization...');
    const [org, orgCreated] = await Organization.findOrCreate({
      where: { name: 'Test OSGB' },
      defaults: {
        name: 'Test OSGB',
        address: 'Test Address',
        phone: '5551234567',
        email: 'test@osgb.com',
        taxNumber: '1234567890',
        taxOffice: 'Test Tax Office',
        isActive: true
      }
    });
    
    console.log(orgCreated ? 'Organization created' : 'Organization already exists');
    console.log('Organization ID:', org.id);
    
    // Create a test admin user
    console.log('Creating test admin user...');
    const [user, userCreated] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: await bcrypt.hash('Admin123!@#', 12),
        fullName: 'System Administrator',
        role: 'admin',
        organizationId: org.id
      }
    });
    
    // If user already exists but doesn't have organizationId, update it
    if (!userCreated && !user.organizationId) {
      console.log('Updating existing user with organization ID...');
      await user.update({ organizationId: org.id });
      console.log('User updated with organization ID');
    }
    
    console.log(userCreated ? 'User created' : 'User already exists');
    console.log('User ID:', user.id);
    console.log('User organization ID:', user.organizationId);
    
    console.log('\nDatabase initialization completed successfully!');
    console.log('\nTest credentials:');
    console.log('- Username: admin');
    console.log('- Password: Admin123!@#');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await sequelize.close();
  }
}

initDatabase();