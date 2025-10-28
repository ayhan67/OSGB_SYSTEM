const { Sequelize } = require('sequelize');

// SQLite configuration for development
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('SQLite connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to SQLite database:', err);
  });

module.exports = sequelize;