const mysql = require('mysql2/promise');

async function createDatabase() {
  try {
    // Create a connection to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });
    
    // Create the database
    await connection.query('CREATE DATABASE IF NOT EXISTS osgb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('Database "osgb_db" created successfully with utf8mb4 charset and utf8mb4_unicode_ci collation');
    
    // Close the connection
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
  }
}

createDatabase();