const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Test database configuration
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false, // Disable logging for tests
  dialect: 'sqlite'
});

module.exports = sequelize;