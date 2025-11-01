const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const securityMiddleware = require('./middleware/securityMiddleware');
const loggingMiddleware = require('./middleware/loggingMiddleware');
const inputValidationMiddleware = require('./middleware/inputValidationMiddleware');

// Load environment variables
dotenv.config();

// Check if we should use SQLite
const useSQLite = process.env.DB_DIALECT === 'sqlite';

// Import models and initialize associations
require('./models/index');

// Import database connection
const sequelize = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const workplaceRoutes = require('./routes/workplaces');
const expertRoutes = require('./routes/experts');
const doctorRoutes = require('./routes/doctors');
const dspRoutes = require('./routes/dsps');
const visitsRoutes = require('./routes/visits');
const organizationRoutes = require('./routes/organizations');

const app = express();
const server = http.createServer(app);
console.log('PORT environment variable:', process.env.PORT);
const PORT = process.env.PORT || 5002;
console.log('Using PORT:', PORT);

// Security middleware
app.use(securityMiddleware);

// Input validation middleware
app.use(inputValidationMiddleware);

// Logging middleware
app.use(loggingMiddleware);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://localhost:3002', 
    'http://192.168.1.103:19000', 
    'http://192.168.1.103:19001', 
    'http://192.168.1.103:19002', 
    'http://192.168.1.103:8081', 
    'exp://192.168.1.103:8081',
    'http://192.168.1.108:19000', 
    'http://192.168.1.108:19001', 
    'http://192.168.1.108:19002', 
    'http://192.168.1.108:8081', 
    'exp://192.168.1.108:8081',
    'http://192.168.1.88:19000', 
    'http://192.168.1.88:19001', 
    'http://192.168.1.88:19002', 
    'http://192.168.1.88:8081', 
    'exp://192.168.1.88:8081'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase payload limit for large requests

// Add raw body parsing for debugging
// app.use((req, res, next) => {
//   if (req.method === 'POST' || req.method === 'PUT') {
//     req.rawBody = '';
//     req.on('data', chunk => {
//       req.rawBody += chunk;
//     });
//     req.on('end', () => {
//       next();
//     });
//   } else {
//     next();
//   }
// });

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Routes
const systemConfigRoutes = require('./routes/systemConfig');

app.use('/api/auth', authRoutes);
app.use('/api/workplaces', workplaceRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/dsps', dspRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/system-config', systemConfigRoutes);

// Add a test endpoint to create a user (for development only)
app.post('/api/create-test-user', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    const Organization = require('./models/Organization');
    
    // Create a test organization first
    const [org] = await Organization.findOrCreate({
      where: { name: 'Test OSGB' },
      defaults: {
        name: 'Test OSGB',
        address: 'Test Address',
        phone: '5551234567',
        email: 'test@osgb.com',
        taxNumber: '1234567890',
        taxOffice: 'Test Tax Office',
        isActive: true
      }
    });
    
    // Create a test admin user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin123!@#', salt);
    
    const user = await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'admin',
      organizationId: org.id
    });
    
    res.status(201).json({ message: 'Test user created successfully', user });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({ message: 'Error creating test user', error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    message: 'Backend server is running and accessible'
  });
});

// Socket.IO setup with proper CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
      "http://localhost:3002", 
      "http://192.168.1.103:3002", 
      "exp://192.168.1.103:8083", 
      "http://192.168.1.103:19000", 
      "http://192.168.1.103:19001", 
      "http://192.168.1.103:19002", 
      "http://192.168.1.103:8081", 
      "exp://192.168.1.103:8081",
      "http://192.168.1.108:19000", 
      "http://192.168.1.108:19001", 
      "http://192.168.1.108:19002", 
      "http://192.168.1.108:8081", 
      "exp://192.168.1.108:8081",
      "http://192.168.1.88:19000", 
      "http://192.168.1.88:19001", 
      "http://192.168.1.88:19002", 
      "http://192.168.1.88:8081", 
      "exp://192.168.1.88:8081"
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected clients
const connectedClients = new Set();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  connectedClients.add(socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedClients.delete(socket.id);
  });
});

// Function to emit visit updates to all clients
const emitVisitUpdate = (data) => {
  io.emit('visitUpdate', data);
};

// Make emitVisitUpdate available globally
global.emitVisitUpdate = emitVisitUpdate;

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Log error details in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Function to start the server after database connection is established
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models with database using a safer approach
    // Use force: false to prevent dropping tables
    await sequelize.sync({ force: false });
    console.log('Database models synchronized.');
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${useSQLite ? 'SQLite' : 'MySQL'}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database connection error:', error);
    console.error('Please ensure your database is running and accessible.');
    if (!useSQLite) {
      console.error('Database configuration:');
      console.error('  Host:', process.env.DB_HOST || 'localhost');
      console.error('  Port:', process.env.DB_PORT || 3306);
      console.error('  Database:', process.env.DB_NAME || 'osgb_db');
      console.error('  User:', process.env.DB_USER || 'root');
      console.error('As an alternative, you can run with SQLite by setting DB_DIALECT=sqlite in your environment variables.');
    }
    
    // Exit process with error code
    process.exit(1);
  }
}

// Start the server
startServer();