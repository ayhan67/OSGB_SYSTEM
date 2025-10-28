const fetch = require('node-fetch');

async function testWorkplaceCreation() {
  try {
    // First, let's login to get a valid token
    const loginResponse = await fetch('http://localhost:5005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!@#',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('Failed to get authentication token');
      return;
    }
    
    const token = loginData.token;
    const organizationId = loginData.user.organizationId;
    
    // Now let's try to create a workplace
    const workplaceData = {
      name: 'Test Workplace',
      address: 'Test Address',
      phone: '5551234567',
      employeeCount: 10,
      riskLevel: 'low',
      sskRegistrationNo: '12345',
      taxOffice: 'Test Tax Office',
      taxNumber: '1234567890',
      registrationDate: '2025-10-28'
    };
    
    console.log('Sending workplace data:', JSON.stringify(workplaceData, null, 2));
    
    const workplaceResponse = await fetch('http://localhost:5005/api/workplaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': organizationId.toString()
      },
      body: JSON.stringify(workplaceData),
    });
    
    console.log('Workplace response status:', workplaceResponse.status);
    console.log('Workplace response headers:', workplaceResponse.headers.raw());
    
    const workplaceDataResponse = await workplaceResponse.json();
    console.log('Workplace response data:', workplaceDataResponse);
  } catch (error) {
    console.error('Error:', error);
  }
}

testWorkplaceCreation();