const fetch = require('node-fetch');

async function debugWorkplaceCreation() {
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
    
    // Get existing experts, doctors, and DSPs to see what IDs are available
    console.log('\n--- Getting existing entities ---');
    
    const expertsResponse = await fetch('http://localhost:5005/api/experts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': organizationId.toString()
      }
    });
    
    const expertsData = await expertsResponse.json();
    console.log('Experts:', expertsData);
    
    const doctorsResponse = await fetch('http://localhost:5005/api/doctors', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': organizationId.toString()
      }
    });
    
    const doctorsData = await doctorsResponse.json();
    console.log('Doctors:', doctorsData);
    
    const dspsResponse = await fetch('http://localhost:5005/api/dsps', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': organizationId.toString()
      }
    });
    
    const dspsData = await dspsResponse.json();
    console.log('DSPs:', dspsData);
    
    // Now let's try to create a workplace with valid data
    const workplaceData = {
      name: 'Test Workplace ' + Date.now(),
      address: 'Test Address',
      phone: '5551234567',
      employeeCount: 10,
      riskLevel: 'low',
      sskRegistrationNo: '12345',
      taxOffice: 'Test Tax Office',
      taxNumber: '1234567890',
      registrationDate: '2025-10-28',
      // Don't set assigned IDs to avoid foreign key constraint errors
    };
    
    console.log('\n--- Sending workplace data ---');
    console.log('Workplace data:', JSON.stringify(workplaceData, null, 2));
    
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
    
    if (workplaceResponse.status === 201) {
      const workplaceDataResponse = await workplaceResponse.json();
      console.log('Workplace created successfully:', workplaceDataResponse);
    } else {
      const errorData = await workplaceResponse.json().catch(() => ({}));
      console.log('Workplace creation failed:', errorData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugWorkplaceCreation();