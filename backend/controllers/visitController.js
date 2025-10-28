const Visit = require('../models/Visit');
const Expert = require('../models/Expert');
const Workplace = require('../models/Workplace');
const Organization = require('../models/Organization');

// Get all visits for the organization
exports.getAllVisits = async (req, res) => {
  try {
    console.log('getAllVisits called');
    
    // Extract organizationId from authenticated user (to be implemented with auth middleware)
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    console.log('getAllVisits called with organizationId:', organizationId);
    
    if (!organizationId) {
      console.log('No organizationId found');
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    console.log('Searching for visits with organizationId:', organizationId);
    
    const visits = await Visit.findAll({
      where: { organizationId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Expert,
          attributes: ['id', 'firstName', 'lastName'],
          where: { organizationId }
        },
        {
          model: Workplace,
          attributes: ['id', 'name'],
          where: { organizationId }
        }
      ]
    });
    
    console.log('Found visits:', visits.length);
    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get visit by ID
exports.getVisitById = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const visit = await Visit.findOne({
      where: { 
        id,
        organizationId
      },
      include: [
        {
          model: Expert,
          attributes: ['id', 'firstName', 'lastName'],
          where: { organizationId }
        },
        {
          model: Workplace,
          attributes: ['id', 'name'],
          where: { organizationId }
        }
      ]
    });
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    res.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new visit
exports.createVisit = async (req, res) => {
  try {
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Validate required fields
    const { expertId, workplaceId, visitMonth, visited } = req.body;
    
    if (!expertId || !workplaceId || !visitMonth) {
      return res.status(400).json({ message: 'Expert, workplace, and visit month are required' });
    }
    
    // Validate that expert and workplace belong to the same organization
    const expert = await Expert.findOne({
      where: { 
        id: expertId,
        organizationId
      }
    });
    
    if (!expert) {
      return res.status(400).json({ message: 'Expert not found in your organization' });
    }
    
    const workplace = await Workplace.findOne({
      where: { 
        id: workplaceId,
        organizationId
      }
    });
    
    if (!workplace) {
      return res.status(400).json({ message: 'Workplace not found in your organization' });
    }
    
    // Check if a visit already exists for this expert, workplace, and month
    const existingVisit = await Visit.findOne({
      where: { 
        expertId,
        workplaceId,
        visitMonth,
        organizationId
      }
    });
    
    if (existingVisit) {
      return res.status(400).json({ message: 'A visit already exists for this expert, workplace, and month' });
    }
    
    const visit = await Visit.create({
      ...req.body,
      organizationId
    });
    
    // Emit visit update to connected clients (if socket.io is set up)
    if (global.emitVisitUpdate) {
      global.emitVisitUpdate(visit);
    }
    
    res.status(201).json(visit);
  } catch (error) {
    console.error('Visit creation error:', error);
    // Check if it's a validation error
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Please fill all fields correctly', error: error.message });
    }
    res.status(500).json({ message: 'Error creating visit', error: error.message });
  }
};

// Update visit
exports.updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const visit = await Visit.findOne({
      where: { 
        id,
        organizationId
      }
    });
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    // Validate that expert and workplace belong to the same organization if they're being updated
    if (req.body.expertId) {
      const expert = await Expert.findOne({
        where: { 
          id: req.body.expertId,
          organizationId
        }
      });
      
      if (!expert) {
        return res.status(400).json({ message: 'Expert not found in your organization' });
      }
    }
    
    if (req.body.workplaceId) {
      const workplace = await Workplace.findOne({
        where: { 
          id: req.body.workplaceId,
          organizationId
        }
      });
      
      if (!workplace) {
        return res.status(400).json({ message: 'Workplace not found in your organization' });
      }
    }
    
    await visit.update(req.body);
    
    // Emit visit update to connected clients (if socket.io is set up)
    if (global.emitVisitUpdate) {
      global.emitVisitUpdate(visit);
    }
    
    res.json(visit);
  } catch (error) {
    console.error('Visit update error:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Please fill all fields correctly', error: error.message });
    }
    res.status(500).json({ message: 'Error updating visit', error: error.message });
  }
};

// Delete visit
exports.deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const visit = await Visit.findOne({
      where: { 
        id,
        organizationId
      }
    });
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    await visit.destroy();
    
    // Emit visit update to connected clients (if socket.io is set up)
    if (global.emitVisitUpdate) {
      global.emitVisitUpdate({ id, deleted: true });
    }
    
    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Visit deletion error:', error);
    res.status(500).json({ message: 'Error deleting visit', error: error.message });
  }
};

// Get visits by expert
exports.getVisitsByExpert = async (req, res) => {
  try {
    const { expertId } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Verify expert belongs to the organization
    const expert = await Expert.findOne({
      where: { 
        id: expertId,
        organizationId
      }
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found in your organization' });
    }

    const visits = await Visit.findAll({
      where: { 
        expertId,
        organizationId
      },
      order: [['visitMonth', 'DESC']],
      include: [
        {
          model: Expert,
          attributes: ['id', 'firstName', 'lastName'],
          where: { organizationId }
        },
        {
          model: Workplace,
          attributes: ['id', 'name'],
          where: { organizationId }
        }
      ]
    });
    
    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits by expert:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get visits by workplace
exports.getVisitsByWorkplace = async (req, res) => {
  try {
    const { workplaceId } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Verify workplace belongs to the organization
    const workplace = await Workplace.findOne({
      where: { 
        id: workplaceId,
        organizationId
      }
    });
    
    if (!workplace) {
      return res.status(404).json({ message: 'Workplace not found in your organization' });
    }

    const visits = await Visit.findAll({
      where: { 
        workplaceId,
        organizationId
      },
      order: [['visitMonth', 'DESC']],
      include: [
        {
          model: Expert,
          attributes: ['id', 'firstName', 'lastName'],
          where: { organizationId }
        },
        {
          model: Workplace,
          attributes: ['id', 'name'],
          where: { organizationId }
        }
      ]
    });
    
    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits by workplace:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get visits by month
exports.getVisitsByMonth = async (req, res) => {
  try {
    const { month } = req.params;
    // Extract organizationId from authenticated user
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const visits = await Visit.findAll({
      where: { 
        visitMonth: month,
        organizationId
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Expert,
          attributes: ['id', 'firstName', 'lastName'],
          where: { organizationId }
        },
        {
          model: Workplace,
          attributes: ['id', 'name'],
          where: { organizationId }
        }
      ]
    });
    
    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits by month:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};