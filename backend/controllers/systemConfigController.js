const SystemConfig = require('../models/SystemConfig');

// Get all system configurations
exports.getAllConfig = async (req, res) => {
  try {
    // Only admin users can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const configs = await SystemConfig.findAll({
      order: [['key', 'ASC']]
    });
    
    res.json(configs);
  } catch (error) {
    console.error('Error fetching system configs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get system configuration by key
exports.getConfigByKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    const config = await SystemConfig.findOne({ where: { key } });
    
    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create or update system configuration
exports.upsertConfig = async (req, res) => {
  try {
    // Only admin users can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { key, value, description } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ message: 'Key and value are required' });
    }
    
    const [config, created] = await SystemConfig.findOrCreate({
      where: { key },
      defaults: { key, value, description }
    });
    
    if (!created) {
      // Update existing config
      await config.update({ value, description });
    }
    
    res.status(created ? 201 : 200).json(config);
  } catch (error) {
    console.error('Error upserting system config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete system configuration
exports.deleteConfig = async (req, res) => {
  try {
    // Only admin users can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { key } = req.params;
    
    const config = await SystemConfig.findOne({ where: { key } });
    
    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    await config.destroy();
    
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting system config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};