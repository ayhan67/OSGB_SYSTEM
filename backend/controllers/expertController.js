const { Sequelize } = require('sequelize');
const Expert = require('../models/Expert');
const Workplace = require('../models/Workplace');
const Visit = require('../models/Visit');
const Organization = require('../models/Organization');
const { clearCache } = require('../middleware/cacheMiddleware');

// Get all experts with used minutes information for the organization
exports.getAllExperts = async (req, res) => {
  try {
    // Extract organizationId from authenticated user (to be implemented with auth middleware)
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const whereClause = { organizationId };

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const expertsWhereClause = { organizationId };

    // Use a single query with aggregation to calculate used minutes
    const experts = await Expert.findAll({
      where: expertsWhereClause,
      order: [['createdAt', 'DESC']],
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT COALESCE(SUM(
                CASE 
                  WHEN w.riskLevel = 'low' THEN w.employeeCount * 10
                  WHEN w.riskLevel = 'dangerous' THEN w.employeeCount * 20
                  WHEN w.riskLevel = 'veryDangerous' THEN w.employeeCount * 40
                  ELSE 0
                END
              ), 0)
              FROM Workplaces w
              WHERE w.assignedExpertId = Expert.id
              AND w.approvalStatus = 'onaylandi'
              AND w.organizationId = ${organizationId}
            )`),
            'usedMinutes'
          ]
        ]
      }
    });
    
    res.json(experts);
  } catch (error) {
    console.error('Error fetching experts:', error);
    res.status(500).json({ message: 'Uzmanlar getirilirken hata oluştu', error: error.message });
  }
};

// Get expert by ID with used minutes information
exports.getExpertById = async (req, res) => {
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
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    whereClause.organizationId = organizationId;

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const expertWhereClause = { id, organizationId };

    // Use a single query with aggregation to calculate used minutes
    const expert = await Expert.findOne({
      where: expertWhereClause,
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT COALESCE(SUM(
                CASE 
                  WHEN w.riskLevel = 'low' THEN w.employeeCount * 10
                  WHEN w.riskLevel = 'dangerous' THEN w.employeeCount * 20
                  WHEN w.riskLevel = 'veryDangerous' THEN w.employeeCount * 40
                  ELSE 0
                END
              ), 0)
              FROM Workplaces w
              WHERE w.assignedExpertId = Expert.id
              AND w.approvalStatus = 'onaylandi'
              AND w.organizationId = ${organizationId}
            )`),
            'usedMinutes'
          ]
        ]
      }
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Uzman bulunamadı' });
    }
    
    res.json(expert);
  } catch (error) {
    console.error('Error fetching expert:', error);
    res.status(500).json({ message: 'Uzman getirilirken hata oluştu', error: error.message });
  }
};

// Get assigned workplaces for an expert
exports.getAssignedWorkplaces = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const expertWhereClause = { id, organizationId };
    const workplaceWhereClause = { assignedExpertId: id, organizationId };

    const expert = await Expert.findOne({
      where: expertWhereClause
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Uzman bulunamadı' });
    }
    
    // Find all workplaces assigned to this expert within the organization
    const assignedWorkplaces = await Workplace.findAll({
      where: workplaceWhereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json(assignedWorkplaces);
  } catch (error) {
    console.error('Error fetching assigned workplaces for expert:', error);
    res.status(500).json({ message: 'Atanan iş yerleri getirilirken hata oluştu', error: error.message });
  }
};

// Create new expert
exports.createExpert = async (req, res) => {
  try {
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Validate required fields
    const { firstName, lastName, phone, expertiseClass } = req.body;
    
    if (!firstName || !lastName || !phone || !expertiseClass) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
    }
    
    // Validate assigned minutes
    const assignedMinutes = req.body.assignedMinutes !== undefined ? req.body.assignedMinutes : 11900;
    if (assignedMinutes > 11900) {
      return res.status(400).json({ message: 'Atanan dakika 11.900\'ü geçemez' });
    }
    
    // Format phone number
    let formattedPhone = phone;
    if (phone) {
      // Remove all non-digit characters and reformat
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10 && digits.startsWith('5')) {
        formattedPhone = `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`;
      }
    }
    
    const expert = await Expert.create({
      firstName,
      lastName,
      phone: formattedPhone,
      expertiseClass,
      assignedMinutes,
      organizationId
    });
    
    // Clear cache for experts
    clearCache('experts');
    
    res.status(201).json(expert);
  } catch (error) {
    console.error('Expert creation error:', error);
    // Check if it's a validation error
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Lütfen tüm alanları doğru şekilde doldurun', error: error.message });
    }
    res.status(500).json({ message: 'Uzman kaydedilirken hata oluştu', error: error.message });
  }
};

// Update expert
exports.updateExpert = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const whereClause = { id, organizationId };

    const expert = await Expert.findOne({
      where: whereClause
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Uzman bulunamadı' });
    }
    
    // Validate assigned minutes if provided
    if (req.body.assignedMinutes !== undefined && req.body.assignedMinutes > 11900) {
      return res.status(400).json({ message: 'Atanan dakika 11.900\'ü geçemez' });
    }
    
    // Format phone number if provided
    if (req.body.phone) {
      // Remove all non-digit characters and reformat
      const digits = req.body.phone.replace(/\D/g, '');
      if (digits.length === 10 && digits.startsWith('5')) {
        req.body.phone = `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`;
      }
    }
    
    await expert.update(req.body);
    
    // Clear cache for experts
    clearCache('experts');
    
    res.json(expert);
  } catch (error) {
    console.error('Expert update error:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Lütfen tüm alanları doğru şekilde doldurun', error: error.message });
    }
    res.status(500).json({ message: 'Uzman güncellenirken hata oluştu', error: error.message });
  }
};

// Delete expert
exports.deleteExpert = async (req, res) => {
  try {
    const { id } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const expert = await Expert.findOne({
      where: { 
        id,
        organizationId
      }
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Uzman bulunamadı' });
    }
    
    await expert.destroy();
    
    // Clear cache for experts
    clearCache('experts');
    
    res.json({ message: 'Uzman başarıyla silindi' });
  } catch (error) {
    console.error('Expert deletion error:', error);
    res.status(500).json({ message: 'Uzman silinirken hata oluştu', error: error.message });
  }
};

// Get visit status summary for an expert
exports.getVisitSummary = async (req, res) => {
  try {
    const { expertId } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
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
      return res.status(404).json({ error: 'Uzman bulunamadı' });
    }
    
    // Get all workplaces assigned to this expert within the organization
    const workplaces = await Workplace.findAll({
      where: { 
        assignedExpertId: expertId,
        organizationId
      },
      attributes: ['id', 'name']
    });
    
    // Get all visits for this expert within the organization
    const visits = await Visit.findAll({
      where: { 
        expertId,
        organizationId
      }
    });
    
    // Create a summary object
    const summary = {};
    workplaces.forEach(workplace => {
      summary[workplace.id] = {
        workplaceName: workplace.name,
        visits: {}
      };
    });
    
    // Populate visit data
    visits.forEach(visit => {
      if (summary[visit.workplaceId]) {
        summary[visit.workplaceId].visits[visit.visitMonth] = {
          visited: visit.visited,
          visitDate: visit.visitDate
        };
      }
    });
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching visit summary:', error);
    res.status(500).json({ error: 'Ziyaret özeti getirilirken hata oluştu' });
  }
};

// Get all visits for an expert with optional month filter
exports.getVisits = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { month } = req.query;
    // Extract organizationId from authenticated user
    let organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
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
      return res.status(404).json({ error: 'Uzman bulunamadı' });
    }
    
    // Build where clause
    const whereClause = { 
      expertId,
      organizationId
    };
    if (month) {
      whereClause.visitMonth = month;
    }
    
    // Get visits for this expert within the organization
    const visits = await Visit.findAll({
      where: whereClause,
      include: [{
        model: Workplace,
        attributes: ['id', 'name'],
        where: { organizationId } // Ensure workplace is also in the same organization
      }],
      order: [['visitMonth', 'DESC']]
    });
    
    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Ziyaretler getirilirken hata oluştu' });
  }
};