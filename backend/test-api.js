const fetch = require('node-fetch');

async function testAPI() {
  try {
    // First, let's login to get a valid token
    console.log('Testing login...');
    const loginResponse = await fetch('http://localhost:5006/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!@#',
      }),
    });

    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      console.log('Login failed with status:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.log('Error response:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData);
    
    if (!loginData.token) {
      console.log('No token received from login');
      return;
    }
    
    const token = loginData.token;
    const organizationId = loginData.user.organizationId;
    
    // Test fetching workplaces with proper headers
    console.log('\nTesting workplaces API...');
    const workplacesResponse = await fetch('http://localhost:5006/api/workplaces', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': organizationId.toString()
      },
    });
    
    console.log('Workplaces response status:', workplacesResponse.status);
    
    if (workplacesResponse.status === 200) {
      const workplacesData = await workplacesResponse.json();
      console.log('Workplaces data:', JSON.stringify(workplacesData, null, 2));
    } else {
      const errorText = await workplacesResponse.text();
      console.log('Workplaces error:', errorText);
    }
    
    // Test fetching experts with proper headers
    console.log('\nTesting experts API...');
    const expertsResponse = await fetch('http://localhost:5006/api/experts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': organizationId.toString()
      },
    });
    
    console.log('Experts response status:', expertsResponse.status);
    
    if (expertsResponse.status === 200) {
      const expertsData = await expertsResponse.json();
      console.log('Experts data:', JSON.stringify(expertsData, null, 2));
    } else {
      const errorText = await expertsResponse.text();
      console.log('Experts error:', errorText);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();