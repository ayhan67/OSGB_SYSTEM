const axios = require('axios');

async function testWeakPassword() {
  try {
    const response = await axios.post('http://localhost:5002/api/auth/register', {
      username: 'weakuser',
      password: '123456',
      fullName: 'Weak User'
    });
    
    console.log('Registration successful (unexpected):', response.data);
  } catch (error) {
    console.log('Registration failed as expected:', error.response ? error.response.data : error.message);
  }
}

testWeakPassword();