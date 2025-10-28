const { check, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const Workplace = require('../models/Workplace');
const Organization = require('../models/Organization');

// Get all doctors with used minutes information for the organization
exports.getAllDoctors = async (req, res) => {
  try {
    // Extract organizationId from authenticated user (to be implemented with auth middleware)
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const whereClause = { organizationId };

    const doctors = await Doctor.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate used minutes for each doctor
    for (let doctor of doctors) {
      // Find all approved workplaces assigned to this doctor within the organization
      const approvedWorkplaces = await Workplace.findAll({
        where: {
          assignedDoctorId: doctor.id,
          approvalStatus: 'onaylandi',
          organizationId
        }
      });
      
      // Calculate total used minutes
      let usedMinutes = 0;
      for (let workplace of approvedWorkplaces) {
        const employeeCount = parseInt(workplace.employeeCount) || 0;
        switch (workplace.riskLevel) {
          case 'low':
            usedMinutes += employeeCount * 5;
            break;
          case 'dangerous':
            usedMinutes += employeeCount * 10;
            break;
          case 'veryDangerous':
            usedMinutes += employeeCount * 15;
            break;
        }
      }
      
      // Add used minutes to doctor object
      doctor.dataValues.usedMinutes = usedMinutes;
      // Also add it to the plain object to ensure it's included in JSON response
      doctor.usedMinutes = usedMinutes;
    }
    
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get doctor by ID with used minutes information
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const whereClause = { id, organizationId };

    const doctor = await Doctor.findOne({
      where: whereClause
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const workplaceWhereClause = {
      assignedDoctorId: doctor.id,
      approvalStatus: 'onaylandi',
      organizationId
    };
    
    // Find all approved workplaces assigned to this doctor
    const approvedWorkplaces = await Workplace.findAll({
      where: workplaceWhereClause
    });
    
    // Calculate total used minutes
    let usedMinutes = 0;
    for (let workplace of approvedWorkplaces) {
      const employeeCount = parseInt(workplace.employeeCount) || 0;
      switch (workplace.riskLevel) {
        case 'low':
          usedMinutes += employeeCount * 5;
          break;
        case 'dangerous':
          usedMinutes += employeeCount * 10;
          break;
        case 'veryDangerous':
          usedMinutes += employeeCount * 15;
          break;
      }
    }
    
    // Add used minutes to doctor object
    doctor.dataValues.usedMinutes = usedMinutes;
    // Also add it to the plain object to ensure it's included in JSON response
    doctor.usedMinutes = usedMinutes;
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get assigned workplaces for a doctor
exports.getAssignedWorkplaces = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const doctorWhereClause = { id, organizationId };
    const workplaceWhereClause = { assignedDoctorId: id, organizationId };

    const doctor = await Doctor.findOne({
      where: doctorWhereClause
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Find all workplaces assigned to this doctor
    const assignedWorkplaces = await Workplace.findAll({
      where: workplaceWhereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json(assignedWorkplaces);
  } catch (error) {
    console.error('Error fetching assigned workplaces for doctor:', error);
    res.status(500).json({ message: 'Assigned workplaces fetch error', error: error.message });
  }
};

// Create new doctor
exports.createDoctor = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('phone', 'Phone is required').not().isEmpty(),
  check('assignedMinutes', 'Assigned minutes must be a number').isInt({ min: 0, max: 11900 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Extract organizationId from authenticated user
      let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
      
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID is required' });
      }

      // Validate assigned minutes
      if (req.body.assignedMinutes > 11900) {
        return res.status(400).json({ message: 'Assigned minutes cannot exceed 11900' });
      }
      
      // Format phone number
      let formattedPhone = req.body.phone;
      if (req.body.phone) {
        // Remove all non-digit characters and reformat
        const digits = req.body.phone.replace(/\D/g, '');
        if (digits.length === 10 && digits.startsWith('5')) {
          formattedPhone = `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`;
        }
      }
      
      const doctor = await Doctor.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: formattedPhone,
        assignedMinutes: req.body.assignedMinutes,
        organizationId
      });
      res.status(201).json(doctor);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

// Update doctor
exports.updateDoctor = [
  check('assignedMinutes', 'Assigned minutes must be a number').optional().isInt({ min: 0, max: 11900 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      // Extract organizationId from authenticated user
      const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
      
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID is required' });
      }

      const doctor = await Doctor.findOne({
        where: { 
          id,
          organizationId
        }
      });
      
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      // Validate assigned minutes
      if (req.body.assignedMinutes > 11900) {
        return res.status(400).json({ message: 'Assigned minutes cannot exceed 11900' });
      }
      
      // Format phone number if provided
      if (req.body.phone) {
        // Remove all non-digit characters and reformat
        const digits = req.body.phone.replace(/\D/g, '');
        if (digits.length === 10 && digits.startsWith('5')) {
          req.body.phone = `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`;
        }
      }
      
      await doctor.update(req.body);
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

// Delete doctor
exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const doctor = await Doctor.findOne({
      where: { 
        id,
        organizationId
      }
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    await doctor.destroy();
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};