const fetch = require('node-fetch');

async function testApiLogin() {
  try {
    console.log('Testing direct API login call...');
    
    // Test admin login
    const response = await fetch('http://localhost:5005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!@#'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('SUCCESS: Login worked!');
    } else {
      console.log('FAILED: Login failed with status', response.status);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testApiLogin();