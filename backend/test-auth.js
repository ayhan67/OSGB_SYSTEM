const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

async function testAuth() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models
    await sequelize.sync();
    
    // Find the admin user
    const user = await User.findOne({ where: { username: 'admin' } });
    
    if (!user) {
      console.log('Admin user not found.');
      return;
    }
    
    console.log('User found:', user.toJSON());
    
    // Test password verification
    const isMatch = await bcrypt.compare('Admin123!@#', user.password);
    console.log('Password match:', isMatch);
    
    if (isMatch) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          organizationId: user.organizationId
        },
        process.env.JWT_SECRET || 'osgb_secret_key',
        { 
          expiresIn: '8h',
          issuer: 'OSGB-System',
          audience: 'OSGB-Client'
        }
      );
      
      console.log('Generated token:', token);
      
      // Test decoding the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'osgb_secret_key');
      console.log('Decoded token:', decoded);
    }
  } catch (error) {
    console.error('Error testing authentication:', error);
  } finally {
    await sequelize.close();
  }
}

testAuth();