const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:5005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!@#',
      }),
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();