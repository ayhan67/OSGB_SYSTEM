const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

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
          'osgb_secret_key',
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
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

testLogin();