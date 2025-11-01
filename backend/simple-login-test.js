const axios = require('axios');

async function testLoginEndpoint() {
  try {
    console.log('Testing login endpoint...');
    
    // Test login with sample data
    const response = await axios.post('http://localhost:5006/api/auth/login', {
      username: 'admin',
      password: 'Admin123!@#'
    });
    
    console.log('Login response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error response:', error.response.data);
      console.log('Error status:', error.response.status);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testLoginEndpoint();