// Test setup file
const sequelize = require('../config/testDatabase');
const { Expert, Doctor, Dsp, Workplace, Visit, Organization, User } = require('../models');

// Override the sequelize instance in models with test database
const models = require('../models');
Object.keys(models).forEach(key => {
  if (models[key] && models[key].sequelize) {
    models[key].sequelize = sequelize;
  }
});

// Setup test database before all tests
beforeAll(async () => {
  // Sync all models
  await sequelize.sync({ force: true });
});

// Clean up test database after all tests
afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Clear all data before each test
beforeEach(async () => {
  // Clear all data from tables
  const tableNames = Object.keys(sequelize.models);
  for (const tableName of tableNames) {
    const model = sequelize.models[tableName];
    if (model && typeof model.destroy === 'function') {
      await model.destroy({ where: {}, force: true });
    }
  }
});

// Export test database for use in tests
module.exports = { sequelize, Expert, Doctor, Dsp, Workplace, Visit, Organization, User };