const mysql = require('mysql2');

// Create connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'osgb_db',
  port: 3306,
  connectTimeout: 10000 // 10 seconds timeout
});

console.log('Attempting to connect to MySQL...');

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused. Is MySQL running?');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Firewall issue?');
    } else if (err.code === 'ENOTFOUND') {
      console.error('Host not found. Check hostname.');
    }
    return;
  }
  console.log('Connected to MySQL successfully!');
  
  // Run a simple query
  connection.query('SELECT 1 + 1 AS solution', (error, results) => {
    if (error) {
      console.error('Error running query:', error);
    } else {
      console.log('Query result:', results[0].solution);
    }
    
    // Close connection
    connection.end();
  });
});