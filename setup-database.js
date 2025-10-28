#!/usr/bin/env node

/**
 * Database Setup Script for OSGB System
 * 
 * This script provides guidance for setting up the MySQL database
 * required for the OSGB System application.
 */

const fs = require('fs');
const path = require('path');

console.log('OSGB System Database Setup Guide');
console.log('================================\n');

console.log('You have two options to set up the database:\n');

console.log('Option 1: Use Docker (Recommended)');
console.log('----------------------------------');
console.log('1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/');
console.log('2. After installation, restart your computer');
console.log('3. Open a terminal in the OSGB_System directory');
console.log('4. Run: docker-compose up -d');
console.log('5. Wait for the containers to start (this may take a few minutes)');
console.log('6. The database will be automatically configured with the correct credentials\n');

console.log('Option 2: Install MySQL Locally');
console.log('-------------------------------');
console.log('1. Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/');
console.log('2. Install MySQL with the following settings:');
console.log('   - Root password: (set a password or leave empty as per your .env file)');
console.log('   - Choose "Standalone MySQL Server" configuration');
console.log('3. After installation, start the MySQL service');
console.log('4. Open MySQL Command Line Client or MySQL Workbench');
console.log('5. Create the database and user with these commands:');
console.log('');
console.log('   CREATE DATABASE osgb_db;');
console.log('   CREATE USER \'root\'@\'localhost\' IDENTIFIED BY \'\';');
console.log('   GRANT ALL PRIVILEGES ON osgb_db.* TO \'root\'@\'localhost\';');
console.log('   FLUSH PRIVILEGES;');
console.log('');
console.log('Note: If you set a password for root, update the .env file accordingly.\n');

console.log('After setting up the database:');
console.log('-----------------------------');
console.log('1. Make sure your .env file in the backend directory has the correct settings:');
console.log('');
console.log('   DB_HOST=localhost');
console.log('   DB_USER=root');
console.log('   DB_PASSWORD=');
console.log('   DB_NAME=osgb_db');
console.log('   DB_PORT=3306');
console.log('');
console.log('2. Run the backend server:');
console.log('   cd backend');
console.log('   npm start');
console.log('');
console.log('If you continue to have connection issues, try:');
console.log('- Checking that MySQL service is running');
console.log('- Verifying firewall settings');
console.log('- Confirming the database credentials in .env file');