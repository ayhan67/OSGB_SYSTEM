const axios = require('axios');

async function testRegistration() {
  try {
    const response = await axios.post('http://localhost:5002/api/auth/register', {
      username: 'testuser',
      password: 'Test123!@#',
      fullName: 'Test User'
    });
    
    console.log('Registration successful:', response.data);
  } catch (error) {
    console.error('Registration failed:', error.response ? error.response.data : error.message);
  }
}

testRegistration();