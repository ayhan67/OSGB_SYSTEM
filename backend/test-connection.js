// test-connection.js - Simple script to test backend server connectivity
const axios = require('axios');

// Test the backend server connection
async function testConnection() {
  const testUrls = [
    'http://localhost:5002/health',
    'http://192.168.1.103:5002/health',
    'http://192.168.1.108:5002/health',
    'http://192.168.1.88:5002/health'
  ];

  console.log('Testing backend server connectivity...\n');

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, { timeout: 5000 });
      console.log(`✓ Success: ${response.data.message}`);
      console.log(`  Status: ${response.data.status}`);
      console.log(`  Port: ${response.data.port}\n`);
    } catch (error) {
      console.log(`✗ Failed: ${url}`);
      console.log(`  Error: ${error.message}\n`);
    }
  }
}

// Run the test
testConnection();