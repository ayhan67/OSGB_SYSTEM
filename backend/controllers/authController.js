const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const passwordValidator = require('../utils/passwordValidator');

// OSGB self-registration (public endpoint)
exports.registerOrganization = [
  // Validation middleware
  check('organizationName', 'Organization name is required').not().isEmpty(),
  check('adminUsername', 'Admin username is required').not().isEmpty(),
  check('adminUsername', 'Admin username must be at least 3 characters').isLength({ min: 3 }),
  check('adminPassword', 'Admin password is required').not().isEmpty(),
  check('adminFullName', 'Admin full name is required').not().isEmpty(),
  check('adminEmail', 'Please include a valid email').optional().isEmail(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { organizationName, adminUsername, adminPassword, adminFullName, adminEmail } = req.body;
      
      // Validate admin password strength
      const passwordValidation = passwordValidator(adminPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: 'Admin password does not meet security requirements',
          errors: passwordValidation.errors
        });
      }
      
      // Check if organization already exists
      const existingOrg = await Organization.findOne({ where: { name: organizationName } });
      if (existingOrg) {
        return res.status(400).json({ message: 'Organization with this name already exists' });
      }
      
      // Check if admin user already exists
      const existingUser = await User.findOne({ where: { username: adminUsername } });
      if (existingUser) {
        return res.status(400).json({ message: 'Admin username already exists' });
      }
      
      // Create organization
      const organization = await Organization.create({
        name: organizationName,
        email: adminEmail,
        isActive: true
      });
      
      // Hash admin password with stronger salt
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create admin user for the organization
      const adminUser = await User.create({
        username: adminUsername,
        password: hashedPassword,
        fullName: adminFullName,
        role: 'admin',
        organizationId: organization.id
      });
      
      // Generate JWT token for the new admin user
      const token = jwt.sign(
        { 
          id: adminUser.id, 
          username: adminUser.username, 
          role: adminUser.role,
          organizationId: adminUser.organizationId
        },
        process.env.JWT_SECRET || 'osgb_secret_key',
        { 
          expiresIn: '8h',
          issuer: 'OSGB-System',
          audience: 'OSGB-Client'
        }
      );
      
      res.status(201).json({
        message: 'Organization and admin user created successfully',
        token,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          fullName: adminUser.fullName,
          role: adminUser.role,
          organizationId: adminUser.organizationId
        },
        organization: {
          id: organization.id,
          name: organization.name
        }
      });
    } catch (error) {
      console.error('Organization registration error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

// User registration with enhanced security
exports.registerUser = [
  // Validation middleware
  check('username', 'Username is required').not().isEmpty(),
  check('username', 'Username must be at least 3 characters').isLength({ min: 3 }),
  check('password', 'Password is required').not().isEmpty(),
  check('fullName', 'Full name is required').not().isEmpty(),
  check('organizationId', 'Organization ID must be a number').optional().isInt(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password, fullName, role, organizationId } = req.body;
      
      // Validate password strength
      const passwordValidation = passwordValidator(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: 'Password does not meet security requirements',
          errors: passwordValidation.errors
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // If organizationId is provided, verify it exists
      if (organizationId) {
        const organization = await Organization.findByPk(organizationId);
        if (!organization) {
          return res.status(400).json({ message: 'Invalid organization ID' });
        }
      }
      
      // Hash password with stronger salt
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user
      const user = await User.create({
        username,
        password: hashedPassword,
        fullName,
        role: role || 'user',
        organizationId: organizationId || null
      });
      
      // Generate JWT token with shorter expiration and organization info
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          organizationId: user.organizationId
        },
        process.env.JWT_SECRET || 'osgb_secret_key',
        { 
          expiresIn: '8h', // Shorter expiration for enhanced security
          issuer: 'OSGB-System',
          audience: 'OSGB-Client'
        }
      );
      
      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

// User login with enhanced security
exports.loginUser = async (req, res) => {
  try {
    console.log('Login request received');
    console.log('Request body:', req.body);
    console.log('Raw body:', req.rawBody);
    
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Check if user exists
    const user = await User.findOne({ where: { username } });
    if (!user) {
      // Generic error message to prevent username enumeration
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Generic error message to prevent password enumeration
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token with organization info
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        organizationId: user.organizationId
      },
      process.env.JWT_SECRET || 'osgb_secret_key',
      { 
        expiresIn: '8h', // Shorter expiration for enhanced security
        issuer: 'OSGB-System',
        audience: 'OSGB-Client'
      }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user is set by jwtAuthMiddleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }, // Exclude password from response
      include: [{
        model: Organization,
        attributes: ['id', 'name'],
        required: false
      }]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const { fullName, currentPassword, newPassword } = req.body;
    
    // Get user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update full name if provided
    if (fullName) {
      user.fullName = fullName;
    }
    
    // Change password if requested
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Validate new password
      const passwordValidation = passwordValidator(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: 'New password does not meet security requirements',
          errors: passwordValidation.errors
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    await user.save();
    
    // Return updated user (without password)
    const { password, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};