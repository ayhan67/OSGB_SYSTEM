const dotenv = require('dotenv');
const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Load environment variables
dotenv.config();

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:5006/api/auth/login', {
      username: 'admin',
      password: 'Admin123!@#'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
  }
}

testLogin();