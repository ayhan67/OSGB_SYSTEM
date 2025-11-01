const axios = require('axios');

async function testWorkplaces() {
  try {
    // First login to get the token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:5006/api/auth/login', {
      username: 'admin',
      password: 'Admin123!@#'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful! Token:', token.substring(0, 50) + '...');
    
    // Now test accessing workplaces with the token
    console.log('Fetching workplaces...');
    const workplacesResponse = await axios.get('http://localhost:5006/api/workplaces', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization-id': '1'
      }
    });
    
    console.log('Workplaces fetched successfully!');
    console.log('Workplaces count:', workplacesResponse.data.length);
    console.log('Workplaces:', JSON.stringify(workplacesResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testWorkplaces();