const Organization = require('../models/Organization');

// Get all organizations (admin only)
exports.getAllOrganizations = async (req, res) => {
  try {
    // This endpoint should only be accessible by system admins
    // In a real implementation, you would check user permissions here
    
    const organizations = await Organization.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get organization by ID
exports.getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you would check if the user has access to this organization
    const organization = await Organization.findByPk(id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new organization (admin only)
exports.createOrganization = async (req, res) => {
  try {
    // This endpoint should only be accessible by system admins
    // In a real implementation, you would check user permissions here
    
    // Validate required fields
    const { name, phone, email } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Organization name is required' });
    }
    
    const organization = await Organization.create({
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    
    res.status(201).json(organization);
  } catch (error) {
    console.error('Organization creation error:', error);
    // Check if it's a validation error
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Please fill all fields correctly', error: error.message });
    }
    res.status(500).json({ message: 'Error creating organization', error: error.message });
  }
};

// Update organization
exports.updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you would check if the user has access to this organization
    const organization = await Organization.findByPk(id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    await organization.update(req.body);
    res.json(organization);
  } catch (error) {
    console.error('Organization update error:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Please fill all fields correctly', error: error.message });
    }
    res.status(500).json({ message: 'Error updating organization', error: error.message });
  }
};

// Delete organization (admin only)
exports.deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    
    // This endpoint should only be accessible by system admins
    // In a real implementation, you would check user permissions here
    
    // Check if organization exists
    const organization = await Organization.findByPk(id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // In a real implementation, you would need to handle data migration or deletion
    // for all entities associated with this organization
    
    await organization.destroy();
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Organization deletion error:', error);
    res.status(500).json({ message: 'Error deleting organization', error: error.message });
  }
};

// Get organization statistics
exports.getOrganizationStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you would check if the user has access to this organization
    const organization = await Organization.findByPk(id);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Return organization with related counts
    const stats = {
      ...organization.toJSON(),
      // In a real implementation, you would join with related tables to get counts
      // For now, we'll just return the organization data
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};