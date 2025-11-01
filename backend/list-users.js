process.env.DB_DIALECT = 'sqlite';
const User = require('./models/User');
const sequelize = require('./config/database');

async function listUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models
    await sequelize.sync({ force: false });
    
    // List all users
    const users = await User.findAll();
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log('- ID:', user.id);
      console.log('  Username:', user.username);
      console.log('  Full Name:', user.fullName);
      console.log('  Role:', user.role);
      console.log('  Organization ID:', user.organizationId);
      console.log('  Created At:', user.createdAt);
      console.log('  Updated At:', user.updatedAt);
      console.log('---');
    });
    
    console.log(`\nTotal users: ${users.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

listUsers();