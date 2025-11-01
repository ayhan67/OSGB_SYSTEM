const { Sequelize, DataTypes } = require('sequelize');

// Connect to SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// Define User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models
    await sequelize.sync();
    
    // Check if we have any users
    const users = await User.findAll();
    console.log(`Found ${users.length} users in the database:`);
    
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Organization ID: ${user.organizationId}`);
    });
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();