const { Sequelize } = require('sequelize');
const Expert = require('../models/Expert');
const Workplace = require('../models/Workplace');
const Visit = require('../models/Visit');
const Organization = require('../models/Organization');
const { clearCache } = require('../middleware/cacheMiddleware');

// Helper function to check if expert can be downgraded based on existing assignments
const canDowngradeExpert = async (expertId, newExpertiseClass, organizationId) => {
  // If upgrading or keeping the same class, no restrictions
  if (newExpertiseClass === 'A') return true;
  
  // Find all workplaces where this expert is assigned
  const assignedWorkplaces = await Workplace.findAll({
    where: { 
      assignedExpertId: expertId,
      organizationId
    }
  });
  
  // Check each workplace to see if the new class would be compatible
  for (const workplace of assignedWorkplaces) {
    // Check compatibility based on new expertise class
    let isCompatible = false;
    switch (newExpertiseClass) {
      case 'B':
        // B class experts can be assigned to dangerous and low risk workplaces
        isCompatible = workplace.riskLevel === 'dangerous' || workplace.riskLevel === 'low';
        break;
      case 'C':
        // C class experts can only be assigned to low risk workplaces
        isCompatible = workplace.riskLevel === 'low';
        break;
      default:
        isCompatible = false;
    }
    
    if (!isCompatible) {
      return false; // Cannot downgrade if already assigned to incompatible workplace
    }
  }
  
  return true;
};

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

    // Use a single query with aggregation to calculate used minutes
    const experts = await Expert.findAll({
      where: whereClause,
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

    // Use a single query with aggregation to calculate used minutes
    const expert = await Expert.findOne({
      where: whereClause,
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

    // Verify that the expert belongs to the organization
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
      if (digits.length === 10) {
        formattedPhone = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
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
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Lütfen tüm alanları doğru şekilde doldurun', error: error.message });
    }
    res.status(500).json({ message: 'Uzman oluşturulurken hata oluştu', error: error.message });
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

    const expert = await Expert.findOne({
      where: { 
        id,
        organizationId
      }
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Uzman bulunamadı' });
    }
    
    // Validate assigned minutes
    if (req.body.assignedMinutes !== undefined && req.body.assignedMinutes > 11900) {
      return res.status(400).json({ message: 'Atanan dakika 11.900\'ü geçemez' });
    }
    
    // Check if expertise class is being changed
    if (req.body.expertiseClass && req.body.expertiseClass !== expert.expertiseClass) {
      // Check if expert can be downgraded
      const canDowngrade = await canDowngradeExpert(id, req.body.expertiseClass, organizationId);
      if (!canDowngrade) {
        return res.status(400).json({ 
          message: 'Bu değişikliği yapamazsınız. Uzman sınıfı daha önce atamasından dolayı değiştirilemez.' 
        });
      }
    }
    
    // Format phone number if provided
    if (req.body.phone) {
      let formattedPhone = req.body.phone;
      const digits = req.body.phone.replace(/\D/g, '');
      if (digits.length === 10) {
        formattedPhone = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
      }
      req.body.phone = formattedPhone;
    }
    
    await expert.update(req.body);
    
    // Clear cache for this expert and all experts
    clearCache(`expert_${id}`);
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
    
    // Clear cache for this expert and all experts
    clearCache(`expert_${id}`);
    clearCache('experts');
    
    res.json({ message: 'Uzman başarıyla silindi' });
  } catch (error) {
    console.error('Expert deletion error:', error);
    res.status(500).json({ message: 'Uzman silinirken hata oluştu', error: error.message });
  }
};

// Get expert statistics
exports.getExpertStats = async (req, res) => {
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

    // Get all experts for the organization
    const experts = await Expert.findAll({
      where: { organizationId },
      attributes: ['id', 'firstName', 'lastName', 'expertiseClass', 'assignedMinutes'],
      include: [{
        model: Workplace,
        as: 'Workplaces',
        attributes: [],
        where: { 
          approvalStatus: 'onaylandi',
          organizationId
        },
        required: false
      }],
      group: ['Expert.id']
    });
    
    // Calculate statistics for each expert
    const expertStats = await Promise.all(experts.map(async (expert) => {
      // Get assigned workplaces count
      const assignedWorkplacesCount = await Workplace.count({
        where: { 
          assignedExpertId: expert.id,
          approvalStatus: 'onaylandi',
          organizationId
        }
      });
      
      // Get tracked workplaces count
      const trackedWorkplacesCount = await Workplace.count({
        where: { 
          trackingExpertId: expert.id,
          approvalStatus: 'onaylandi',
          organizationId
        }
      });
      
      // Get current month visits count
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const currentMonthVisitsCount = await Visit.count({
        where: { 
          expertId: expert.id,
          visitMonth: currentMonth,
          organizationId
        }
      });
      
      return {
        expert: {
          id: expert.id,
          firstName: expert.firstName,
          lastName: expert.lastName,
          expertiseClass: expert.expertiseClass,
          assignedMinutes: expert.assignedMinutes
        },
        assignedWorkplaceCount: assignedWorkplacesCount,
        trackedWorkplaceCount: trackedWorkplacesCount,
        currentMonthVisitCount: currentMonthVisitsCount,
        remainingWorkplaceCount: assignedWorkplacesCount - currentMonthVisitsCount
      };
    }));
    
    res.json(expertStats);
  } catch (error) {
    console.error('Error fetching expert stats:', error);
    res.status(500).json({ message: 'Uzman istatistikleri getirilirken hata oluştu', error: error.message });
  }
};

// Get visit summary for an expert
exports.getVisitSummary = async (req, res) => {
  try {
    const { expertId } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Verify that the expert belongs to the organization
    const expert = await Expert.findOne({
      where: { 
        id: expertId,
        organizationId
      }
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Uzman bulunamadı' });
    }

    // Get all visits for this expert grouped by workplace and month
    const visits = await Visit.findAll({
      where: { 
        expertId,
        organizationId
      },
      attributes: [
        'workplaceId',
        'visitMonth',
        'visited'
      ],
      order: [['visitMonth', 'DESC']]
    });

    // Organize visits by workplace and month
    const visitSummary = {};
    
    visits.forEach(visit => {
      if (!visitSummary[visit.workplaceId]) {
        visitSummary[visit.workplaceId] = {
          workplaceId: visit.workplaceId,
          visits: {}
        };
      }
      
      visitSummary[visit.workplaceId].visits[visit.visitMonth] = {
        visited: visit.visited,
        visitMonth: visit.visitMonth
      };
    });

    res.json(visitSummary);
  } catch (error) {
    console.error('Error fetching visit summary:', error);
    res.status(500).json({ message: 'Ziyaret özeti getirilirken hata oluştu', error: error.message });
  }
};

// Get all visits for an expert
exports.getVisits = async (req, res) => {
  try {
    const { expertId } = req.params;
    // Extract organizationId from authenticated user
    let organizationId = req.organizationId || req.user?.organizationId || req.headers['x-organization-id'];
    
    // Ensure organizationId is a number
    if (typeof organizationId === 'string') {
      organizationId = parseInt(organizationId, 10);
    }
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Verify that the expert belongs to the organization
    const expert = await Expert.findOne({
      where: { 
        id: expertId,
        organizationId
      }
    });
    
    if (!expert) {
      return res.status(404).json({ message: 'Uzman bulunamadı' });
    }

    // Get all visits for this expert with related data
    const visits = await Visit.findAll({
      where: { 
        expertId,
        organizationId
      },
      order: [['visitMonth', 'DESC']],
      include: [
        {
          model: Expert,
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Workplace,
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ message: 'Ziyaretler getirilirken hata oluştu', error: error.message });
  }
};
