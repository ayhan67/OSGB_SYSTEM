// This is a simple test script to verify the authentication flow
// In a real application, this would be handled by the frontend components

console.log('Testing authentication flow...');

// Test login function
const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:5002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'Test123!@#'
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
      return data.token;
    } else {
      console.error('Login failed:', response.status, await response.text());
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

// Test protected route access
const testProtectedRoute = async (token) => {
  try {
    const response = await fetch('http://localhost:5002/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Protected route access successful:', data);
      return true;
    } else {
      console.error('Protected route access failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('Protected route access error:', error);
    return false;
  }
};

// Run the tests
(async () => {
  console.log('Starting authentication tests...');
  
  // Test login
  const token = await testLogin();
  
  if (token) {
    // Test protected route access
    await testProtectedRoute(token);
  }
  
  console.log('Authentication tests completed.');
})();