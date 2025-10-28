// Simple test to check frontend login
console.log('Testing frontend login...');

// Check if REACT_APP_API_URL is set
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Test a simple fetch
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';
console.log('Using API base URL:', API_BASE_URL);

// Try to login
fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin123!@#'
  })
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});