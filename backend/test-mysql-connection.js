#!/usr/bin/env node

/**
 * MySQL Connection Test Script for OSGB System
 * 
 * This script tests if the MySQL database is accessible with the current configuration.
 */

const sequelize = require('./config/database');

async function testMySQLConnection() {
  console.log('Testing MySQL database connection...');
  
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ MySQL connection successful!');
    
    // Get database version
    const [results] = await sequelize.query('SELECT VERSION() as version');
    console.log(`📊 Database version: ${results[0].version}`);
    
    // Get database name
    const dbName = sequelize.config.database;
    console.log(`🗃️  Database name: ${dbName}`);
    
    // Get connection details
    const config = sequelize.config;
    console.log(`🔗 Host: ${config.host}:${config.port}`);
    console.log(`👤 User: ${config.username}`);
    
    // Close connection
    await sequelize.close();
    console.log('🔒 Database connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MySQL connection failed!');
    console.error('Error details:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.original ? error.original.code : 'N/A'}`);
    console.error(`  Syscall: ${error.original ? error.original.syscall : 'N/A'}`);
    console.error(`  Host: ${sequelize.config.host}:${sequelize.config.port}`);
    console.error(`  Database: ${sequelize.config.database}`);
    console.error(`  User: ${sequelize.config.username}`);
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if MySQL service is running in XAMPP');
    console.log('2. Verify database credentials in .env file');
    console.log('3. Check if the database "osgb_db" exists');
    console.log('4. Verify firewall settings');
    console.log('5. Try connecting with a MySQL client to test connectivity');
    
    process.exit(1);
  }
}

testMySQLConnection();