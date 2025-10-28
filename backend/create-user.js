const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Force SQLite configuration for this script
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log,
});

// Define the User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true
});

async function createDefaultUser() {
  try {
    // Sync the User model
    await sequelize.sync();
    console.log('Database synced successfully!');
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ where: { username: 'admin' } });
    if (existingUser) {
      console.log('Admin user already exists:', existingUser.toJSON());
      return;
    }
    
    // Create a sample admin user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin123!@#', salt);
    
    const adminUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'admin'
    });
    
    console.log('Sample admin user created:', adminUser.toJSON());
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await sequelize.close();
  }
}

createDefaultUser();