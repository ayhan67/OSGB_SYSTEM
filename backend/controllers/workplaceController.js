const Workplace = require('../models/Workplace');
const Expert = require('../models/Expert');
const Doctor = require('../models/Doctor');
const Dsp = require('../models/DSP');
const Organization = require('../models/Organization');
const { clearCache } = require('../middleware/cacheMiddleware');

// Get all workplaces for the organization
exports.getAllWorkplaces = async (req, res) => {
  try {
    // Extract organizationId from authenticated user (to be implemented with auth middleware)
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    // For admin users, show all workplaces
    let whereClause = {};
    if (req.user && req.user.role !== 'admin') {
      // Non-admin users can only see their organization's workplaces
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID is required' });
      }
      whereClause = { organizationId };
    }
    // Admin users will see all workplaces (no organization filter)

    // Optimize query with proper indexing and eager loading
    const workplaces = await Workplace.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Expert,
          as: 'Expert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false // Use LEFT JOIN instead of INNER JOIN
        },
        {
          model: Doctor,
          as: 'Doctor',
          attributes: ['id', 'firstName', 'lastName'],
          required: false // Use LEFT JOIN instead of INNER JOIN
        },
        {
          model: Dsp,
          as: 'Dsp',
          attributes: ['id', 'firstName', 'lastName'],
          required: false // Use LEFT JOIN instead of INNER JOIN
        },
        {
          model: Expert,
          as: 'TrackingExpert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false // Use LEFT JOIN instead of INNER JOIN
        }
      ]
    });
    
    res.json(workplaces);
  } catch (error) {
    console.error('Error fetching workplaces:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get workplace by ID
exports.getWorkplaceById = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    // Build where clause
    let whereClause = { id };
    
    // For non-admin users, filter by organization
    if (req.user && req.user.role !== 'admin') {
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID is required' });
      }
      whereClause.organizationId = organizationId;
    }
    // Admin users can access any workplace

    const workplace = await Workplace.findOne({
      where: whereClause,
      include: [
        {
          model: Expert,
          as: 'Expert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Doctor,
          as: 'Doctor',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Dsp,
          as: 'Dsp',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Expert,
          as: 'TrackingExpert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ]
    });
    
    if (!workplace) {
      return res.status(404).json({ message: 'Workplace not found' });
    }
    
    res.json(workplace);
  } catch (error) {
    console.error('Error fetching workplace:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new workplace
exports.createWorkplace = async (req, res) => {
  try {
    console.log('=== Workplace Creation Debug Info ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    console.log('User from auth middleware:', req.user);
    
    // Extract organizationId from authenticated user (to be implemented with auth middleware)
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    console.log('Organization ID:', organizationId);
    
    // Admin users must specify organization ID when creating workplace
    if (req.user && req.user.role === 'admin') {
      if (!organizationId) {
        console.log('ERROR: Organization ID is missing for admin user');
        return res.status(400).json({ message: 'Admin users must specify organization ID when creating workplace' });
      }
    } else {
      // Non-admin users use their own organization ID
      if (!organizationId) {
        console.log('ERROR: Organization ID is missing');
        return res.status(400).json({ message: 'Organization ID is required' });
      }
    }

    // Validate required fields
    const { name, address, phone, employeeCount, riskLevel, sskRegistrationNo, taxOffice, taxNumber, registrationDate } = req.body;
    
    console.log('Required fields check:', {
      name: !!name,
      address: !!address,
      phone: !!phone,
      employeeCount: !!employeeCount,
      riskLevel: !!riskLevel,
      sskRegistrationNo: !!sskRegistrationNo,
      taxOffice: !!taxOffice,
      taxNumber: !!taxNumber,
      registrationDate: !!registrationDate
    });
    
    if (!name || !address || !phone || !employeeCount || !riskLevel || !sskRegistrationNo || !taxOffice || !taxNumber || !registrationDate) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!address) missingFields.push('address');
      if (!phone) missingFields.push('phone');
      if (!employeeCount) missingFields.push('employeeCount');
      if (!riskLevel) missingFields.push('riskLevel');
      if (!sskRegistrationNo) missingFields.push('sskRegistrationNo');
      if (!taxOffice) missingFields.push('taxOffice');
      if (!taxNumber) missingFields.push('taxNumber');
      if (!registrationDate) missingFields.push('registrationDate');
      
      console.log('ERROR: Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: missingFields
      });
    }
    
    // Validate assigned IDs belong to the same organization
    if (req.body.assignedExpertId) {
      const expert = await Expert.findOne({
        where: { 
          id: req.body.assignedExpertId,
          organizationId
        }
      });
      if (!expert) {
        console.log('ERROR: Assigned expert not found in organization');
        return res.status(400).json({ message: 'Assigned expert not found in your organization' });
      }
    }
    
    if (req.body.assignedDoctorId) {
      const doctor = await Doctor.findOne({
        where: { 
          id: req.body.assignedDoctorId,
          organizationId
        }
      });
      if (!doctor) {
        console.log('ERROR: Assigned doctor not found in organization');
        return res.status(400).json({ message: 'Assigned doctor not found in your organization' });
      }
    }
    
    if (req.body.assignedDspId) {
      const dsp = await Dsp.findOne({
        where: { 
          id: req.body.assignedDspId,
          organizationId
        }
      });
      if (!dsp) {
        console.log('ERROR: Assigned DSP not found in organization');
        return res.status(400).json({ message: 'Assigned DSP not found in your organization' });
      }
    }
    
    console.log('Creating workplace with data:', {
      ...req.body,
      organizationId
    });
    
    const workplace = await Workplace.create({
      ...req.body,
      organizationId
    });
    
    console.log('Workplace created successfully with ID:', workplace.id);
    
    // If the workplace is created with 'onaylandi' status, update assigned minutes
    if (workplace.approvalStatus === 'onaylandi') {
      await updateAssignedMinutesForApprovedWorkplace(workplace, organizationId);
    }
    
    // Fetch the created workplace with all associations
    const workplaceWithAssociations = await Workplace.findOne({
      where: { 
        id: workplace.id,
        organizationId
      },
      include: [
        {
          model: Expert,
          as: 'Expert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Doctor,
          as: 'Doctor',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Dsp,
          as: 'Dsp',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Expert,
          as: 'TrackingExpert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ]
    });
    
    // Clear cache for workplaces
    clearCache('workplaces');
    
    res.status(201).json(workplaceWithAssociations);
  } catch (error) {
    console.error('Workplace creation error:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Please fill all required fields correctly', error: error.message });
    }
    res.status(500).json({ message: 'Error creating workplace', error: error.message });
  }
};

// Update workplace
exports.updateWorkplace = async (req, res) => {
  try {
    console.log('=== Workplace Update Debug Info ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request params:', req.params);
    console.log('Request headers:', req.headers);
    console.log('User from auth middleware:', req.user);
    
    const { id } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    console.log('Organization ID:', organizationId);
    
    // Build where clause
    let whereClause = { id };
    
    // For non-admin users, filter by organization
    if (req.user && req.user.role !== 'admin') {
      if (!organizationId) {
        console.log('ERROR: Organization ID is missing');
        return res.status(400).json({ message: 'Organization ID is required' });
      }
      whereClause.organizationId = organizationId;
    } else {
      // Admin users must specify organization ID
      if (!organizationId) {
        console.log('ERROR: Organization ID is missing for admin user');
        return res.status(400).json({ message: 'Admin users must specify organization ID when updating workplace' });
      }
      whereClause.organizationId = organizationId;
    }

    const workplace = await Workplace.findOne({
      where: whereClause
    });
    
    if (!workplace) {
      console.log('ERROR: Workplace not found');
      return res.status(404).json({ message: 'Workplace not found' });
    }
    
    console.log('Existing workplace:', JSON.stringify(workplace.toJSON(), null, 2));
    console.log('Previous approval status:', workplace.approvalStatus);
    
    // Store the previous approval status to compare later
    const previousApprovalStatus = workplace.approvalStatus;
    
    // Validate assigned IDs belong to the same organization
    if (req.body.assignedExpertId) {
      const expert = await Expert.findOne({
        where: { 
          id: req.body.assignedExpertId,
          organizationId
        }
      });
      if (!expert) {
        console.log('ERROR: Assigned expert not found in organization');
        return res.status(400).json({ message: 'Assigned expert not found in your organization' });
      }
    }
    
    if (req.body.assignedDoctorId) {
      const doctor = await Doctor.findOne({
        where: { 
          id: req.body.assignedDoctorId,
          organizationId
        }
      });
      if (!doctor) {
        console.log('ERROR: Assigned doctor not found in organization');
        return res.status(400).json({ message: 'Assigned doctor not found in your organization' });
      }
    }
    
    if (req.body.assignedDspId) {
      const dsp = await Dsp.findOne({
        where: { 
          id: req.body.assignedDspId,
          organizationId
        }
      });
      if (!dsp) {
        console.log('ERROR: Assigned DSP not found in organization');
        return res.status(400).json({ message: 'Assigned DSP not found in your organization' });
      }
    }
    
    // Validate tracking expert ID belongs to the same organization
    if (req.body.trackingExpertId) {
      const trackingExpert = await Expert.findOne({
        where: { 
          id: req.body.trackingExpertId,
          organizationId
        }
      });
      if (!trackingExpert) {
        console.log('ERROR: Tracking expert not found in organization');
        return res.status(400).json({ message: 'Tracking expert not found in your organization' });
      }
    }
    
    // Update the workplace
    console.log('Updating workplace with data:', req.body);
    await workplace.update(req.body);
    
    console.log('Updated workplace:', JSON.stringify(workplace.toJSON(), null, 2));
    console.log('New approval status:', workplace.approvalStatus);
    
    // Check if approval status changed to 'onaylandi' (approved)
    if (previousApprovalStatus !== 'onaylandi' && workplace.approvalStatus === 'onaylandi') {
      console.log('Approval status changed to ONAYLANDI - deducting minutes');
      // Approval status changed to approved, update assigned minutes for assigned personnel
      await updateAssignedMinutesForApprovedWorkplace(workplace, organizationId);
    } else if (previousApprovalStatus === 'onaylandi' && workplace.approvalStatus !== 'onaylandi') {
      console.log('Approval status changed from ONAYLANDI - reverting minutes');
      // Approval status changed from approved to something else, revert assigned minutes
      await revertAssignedMinutesForUnapprovedWorkplace(workplace, organizationId);
    } else {
      console.log('No approval status change that requires minute adjustment');
      console.log('Previous status:', previousApprovalStatus, 'New status:', workplace.approvalStatus);
    }
    
    // Clear cache for workplaces
    clearCache('workplaces');
    
    res.json(workplace);
  } catch (error) {
    console.error('Workplace update error:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Please fill all fields correctly', error: error.message });
    }
    res.status(500).json({ message: 'Error updating workplace', error: error.message });
  }
};

// Delete workplace
exports.deleteWorkplace = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    // Build where clause
    let whereClause = { id };
    
    // For non-admin users, filter by organization
    if (req.user && req.user.role !== 'admin') {
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID is required' });
      }
      whereClause.organizationId = organizationId;
    } else {
      // Admin users must specify organization ID
      if (!organizationId) {
        return res.status(400).json({ message: 'Admin users must specify organization ID when deleting workplace' });
      }
      whereClause.organizationId = organizationId;
    }

    const workplace = await Workplace.findOne({
      where: whereClause
    });
    
    if (!workplace) {
      return res.status(404).json({ message: 'Workplace not found' });
    }
    
    await workplace.destroy();
    
    // Clear cache for workplaces
    clearCache('workplaces');
    
    res.json({ message: 'Workplace deleted successfully' });
  } catch (error) {
    console.error('Workplace deletion error:', error);
    res.status(500).json({ message: 'Error deleting workplace', error: error.message });
  }
};

// Get workplaces by approval status
exports.getWorkplacesByApprovalStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const workplaces = await Workplace.findAll({
      where: { 
        approvalStatus: status,
        organizationId
      },
      include: [
        {
          model: Expert,
          as: 'Expert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Doctor,
          as: 'Doctor',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Dsp,
          as: 'Dsp',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(workplaces);
  } catch (error) {
    console.error('Error fetching workplaces by approval status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get workplaces by expert
exports.getWorkplacesByExpert = async (req, res) => {
  try {
    const { expertId } = req.params;
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Validate expert exists within the organization
    const expert = await Expert.findOne({
      where: { 
        id: expertId,
        organizationId
      }
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    const workplaces = await Workplace.findAll({
      where: { 
        assignedExpertId: expertId,
        organizationId
      },
      include: [
        {
          model: Expert,
          as: 'Expert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Doctor,
          as: 'Doctor',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Dsp,
          as: 'Dsp',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(workplaces);
  } catch (error) {
    console.error('Error fetching workplaces by expert:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get workplaces by doctor
exports.getWorkplacesByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Validate doctor exists within the organization
    const doctor = await Doctor.findOne({
      where: { 
        id: doctorId,
        organizationId
      }
    });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const workplaces = await Workplace.findAll({
      where: { 
        assignedDoctorId: doctorId,
        organizationId
      },
      include: [
        {
          model: Expert,
          as: 'Expert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Doctor,
          as: 'Doctor',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Dsp,
          as: 'Dsp',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(workplaces);
  } catch (error) {
    console.error('Error fetching workplaces by doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get workplaces by DSP
exports.getWorkplacesByDsp = async (req, res) => {
  try {
    const { dspId } = req.params;
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Validate DSP exists within the organization
    const dsp = await Dsp.findOne({
      where: { 
        id: dspId,
        organizationId
      }
    });
    
    if (!dsp) {
      return res.status(404).json({ message: 'DSP not found' });
    }

    const workplaces = await Workplace.findAll({
      where: { 
        assignedDspId: dspId,
        organizationId
      },
      include: [
        {
          model: Expert,
          as: 'Expert',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Doctor,
          as: 'Doctor',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Dsp,
          as: 'Dsp',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(workplaces);
  } catch (error) {
    console.error('Error fetching workplaces by DSP:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Function to update assigned minutes when workplace is approved
async function updateAssignedMinutesForApprovedWorkplace(workplace, organizationId) {
  const employeeCount = parseInt(workplace.employeeCount) || 0;
  
  // Update expert assigned minutes
  if (workplace.assignedExpertId) {
    let minutesToDeduct = 0;
    
    switch (workplace.riskLevel) {
      case 'low':
        minutesToDeduct = employeeCount * 10;
        break;
      case 'dangerous':
        minutesToDeduct = employeeCount * 20;
        break;
      case 'veryDangerous':
        minutesToDeduct = employeeCount * 40;
        break;
    }
    
    if (minutesToDeduct > 0) {
      await Expert.increment(
        { assignedMinutes: -minutesToDeduct },
        { where: { id: workplace.assignedExpertId, organizationId } }
      );
    }
  }
  
  // Update doctor assigned minutes
  if (workplace.assignedDoctorId) {
    let minutesToDeduct = 0;
    
    switch (workplace.riskLevel) {
      case 'low':
        minutesToDeduct = employeeCount * 5;
        break;
      case 'dangerous':
        minutesToDeduct = employeeCount * 10;
        break;
      case 'veryDangerous':
        minutesToDeduct = employeeCount * 15;
        break;
    }
    
    if (minutesToDeduct > 0) {
      await Doctor.increment(
        { assignedMinutes: -minutesToDeduct },
        { where: { id: workplace.assignedDoctorId, organizationId } }
      );
    }
  }
  
  // Update DSP assigned minutes (only for very dangerous risk with more than 10 employees)
  if (workplace.assignedDspId && workplace.riskLevel === 'veryDangerous' && employeeCount > 10) {
    const minutesToDeduct = employeeCount * 5;
    
    await Dsp.increment(
      { assignedMinutes: -minutesToDeduct },
      { where: { id: workplace.assignedDspId, organizationId } }
    );
  }
}

// Function to revert assigned minutes when workplace approval is cancelled
async function revertAssignedMinutesForUnapprovedWorkplace(workplace, organizationId) {
  const employeeCount = parseInt(workplace.employeeCount) || 0;
  
  // Revert expert assigned minutes
  if (workplace.assignedExpertId) {
    let minutesToRevert = 0;
    
    switch (workplace.riskLevel) {
      case 'low':
        minutesToRevert = employeeCount * 10;
        break;
      case 'dangerous':
        minutesToRevert = employeeCount * 20;
        break;
      case 'veryDangerous':
        minutesToRevert = employeeCount * 40;
        break;
    }
    
    if (minutesToRevert > 0) {
      await Expert.increment(
        { assignedMinutes: minutesToRevert },
        { where: { id: workplace.assignedExpertId, organizationId } }
      );
    }
  }
  
  // Revert doctor assigned minutes
  if (workplace.assignedDoctorId) {
    let minutesToRevert = 0;
    
    switch (workplace.riskLevel) {
      case 'low':
        minutesToRevert = employeeCount * 5;
        break;
      case 'dangerous':
        minutesToRevert = employeeCount * 10;
        break;
      case 'veryDangerous':
        minutesToRevert = employeeCount * 15;
        break;
    }
    
    if (minutesToRevert > 0) {
      await Doctor.increment(
        { assignedMinutes: minutesToRevert },
        { where: { id: workplace.assignedDoctorId, organizationId } }
      );
    }
  }
  
  // Revert DSP assigned minutes (only for very dangerous risk with more than 10 employees)
  if (workplace.assignedDspId && workplace.riskLevel === 'veryDangerous' && employeeCount > 10) {
    const minutesToRevert = employeeCount * 5;
    
    await Dsp.increment(
      { assignedMinutes: minutesToRevert },
      { where: { id: workplace.assignedDspId, organizationId } }
    );
  }
}
