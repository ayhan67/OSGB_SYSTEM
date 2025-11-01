const Dsp = require('../models/DSP');
const Workplace = require('../models/Workplace');
const Organization = require('../models/Organization');

// Get all DSPs for the organization
exports.getAllDSPs = async (req, res) => {
  try {
    // Extract organizationId from authenticated user (to be implemented with auth middleware)
    const organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const dsps = await Dsp.findAll({
      where: { organizationId },
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate used minutes for each DSP
    for (let dsp of dsps) {
      // Find all approved very dangerous workplaces with more than 10 employees assigned to this DSP within the organization
      const approvedWorkplaces = await Workplace.findAll({
        where: {
          assignedDspId: dsp.id,
          approvalStatus: 'onaylandi',
          riskLevel: 'veryDangerous',
          employeeCount: {
            [require('sequelize').Op.gt]: 10
          },
          organizationId
        }
      });
      
      // Calculate total used minutes (5 minutes per employee for each workplace)
      let usedMinutes = 0;
      for (let workplace of approvedWorkplaces) {
        const employeeCount = parseInt(workplace.employeeCount) || 0;
        usedMinutes += employeeCount * 5;
      }
      
      // Add used minutes to DSP object
      dsp.dataValues.usedMinutes = usedMinutes;
      // Also add it to the plain object to ensure it's included in JSON response
      dsp.usedMinutes = usedMinutes;
    }
    
    res.json(dsps);
  } catch (error) {
    console.error('Error fetching DSPs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get DSP by ID
exports.getDSPById = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const dsp = await Dsp.findOne({
      where: { 
        id,
        organizationId
      }
    });
    
    if (!dsp) {
      return res.status(404).json({ message: 'DSP not found' });
    }
    
    // Find all approved very dangerous workplaces with more than 10 employees assigned to this DSP within the organization
    const approvedWorkplaces = await Workplace.findAll({
      where: {
        assignedDspId: dsp.id,
        approvalStatus: 'onaylandi',
        riskLevel: 'veryDangerous',
        employeeCount: {
          [require('sequelize').Op.gt]: 10
        },
        organizationId
      }
    });
    
    // Calculate total used minutes (5 minutes per employee for each workplace)
    let usedMinutes = 0;
    for (let workplace of approvedWorkplaces) {
      const employeeCount = parseInt(workplace.employeeCount) || 0;
      usedMinutes += employeeCount * 5;
    }
    
    // Add used minutes to DSP object
    dsp.dataValues.usedMinutes = usedMinutes;
    // Also add it to the plain object to ensure it's included in JSON response
    dsp.usedMinutes = usedMinutes;
    
    res.json(dsp);
  } catch (error) {
    console.error('Error fetching DSP:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new DSP
exports.createDSP = async (req, res) => {
  try {
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Validate required fields
    const { firstName, lastName, phone } = req.body;
    
    if (!firstName) {
      return res.status(400).json({ message: 'Ad alanı zorunludur' });
    }
    
    if (!lastName) {
      return res.status(400).json({ message: 'Soyad alanı zorunludur' });
    }
    
    const dsp = await Dsp.create({
      firstName,
      lastName,
      phone,
      organizationId,
      assignedMinutes: req.body.assignedMinutes || 11900 // Default to 11900 if not provided
    });
    
    res.status(201).json(dsp);
  } catch (error) {
    console.error('DSP creation error:', error);
    // Check if it's a validation error
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Lütfen tüm alanları doğru şekilde doldurun', error: error.message });
    }
    res.status(500).json({ message: 'DSP kaydedilirken hata oluştu', error: error.message });
  }
};

// Update DSP
exports.updateDSP = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const dsp = await Dsp.findOne({
      where: { 
        id,
        organizationId
      }
    });
    
    if (!dsp) {
      return res.status(404).json({ message: 'DSP bulunamadı' });
    }
    
    await dsp.update(req.body);
    res.json(dsp);
  } catch (error) {
    console.error('DSP update error:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Lütfen tüm alanları doğru şekilde doldurun', error: error.message });
    }
    res.status(500).json({ message: 'DSP güncellenirken hata oluştu', error: error.message });
  }
};

// Delete DSP
exports.deleteDSP = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const dsp = await Dsp.findOne({
      where: { 
        id,
        organizationId
      }
    });
    
    if (!dsp) {
      return res.status(404).json({ message: 'DSP bulunamadı' });
    }
    
    await dsp.destroy();
    res.json({ message: 'DSP başarıyla silindi' });
  } catch (error) {
    console.error('DSP deletion error:', error);
    res.status(500).json({ message: 'DSP silinirken hata oluştu', error: error.message });
  }
};