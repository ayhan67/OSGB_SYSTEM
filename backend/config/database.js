const { Sequelize } = require('sequelize');

// Determine if we're in a Docker environment
const isDocker = process.env.DB_HOST === 'database';

// Determine if we want to use SQLite (for development/testing)
const useSQLite = process.env.DB_DIALECT === 'sqlite';

// Configuration for different environments
const config = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'osgb_db',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000 // Increase connection timeout to 60 seconds
    },
    retry: {
      max: 3 // Retry connection up to 3 times
    }
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'osgb_db',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      },
      connectTimeout: 60000 // Increase connection timeout to 60 seconds
    },
    pool: {
      max: 20, // Increased from 5 to 20
      min: 5,  // Increased from 0 to 5
      acquire: 60000, // Increased from 30000 to 60000
      idle: 10000,
      evict: 1000 // Add eviction timeout
    },
    retry: {
      max: 3 // Retry connection up to 3 times
    }
  },
  sqlite: {
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

// Use SQLite if explicitly requested, otherwise use Docker config or development config
let sequelize;
if (useSQLite) {
  sequelize = new Sequelize(config.sqlite);
} else {
  const dbConfig = isDocker ? config.production : config.development;
  sequelize = new Sequelize(
    dbConfig.database || 'osgb_db',
    dbConfig.username || 'root',
    dbConfig.password || '',
    dbConfig
  );
}

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log(`Connection has been established successfully using ${useSQLite ? 'SQLite' : isDocker ? 'Docker MySQL' : 'local MySQL'}.`);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;