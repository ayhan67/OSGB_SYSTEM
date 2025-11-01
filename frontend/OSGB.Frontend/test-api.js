const { login, getAllWorkplaces } = require('./src/services/api');

async function testApi() {
  try {
    console.log('Testing API...');
    
    // Login
    console.log('Logging in...');
    const loginData = await login('admin', 'Admin123!@#');
    console.log('Login successful!', loginData);
    
    // Fetch workplaces
    console.log('Fetching workplaces...');
    const workplaces = await getAllWorkplaces();
    console.log('Workplaces fetched!', workplaces);
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testApi();