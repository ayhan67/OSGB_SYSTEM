'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add indexes to improve query performance
    
    // Index on Expert table for organizationId
    await queryInterface.addIndex('Experts', ['organizationId'], {
      name: 'idx_experts_organization_id'
    });
    
    // Index on Expert table for createdAt (for ordering)
    await queryInterface.addIndex('Experts', ['createdAt'], {
      name: 'idx_experts_created_at'
    });
    
    // Index on Workplace table for organizationId
    await queryInterface.addIndex('Workplaces', ['organizationId'], {
      name: 'idx_workplaces_organization_id'
    });
    
    // Index on Workplace table for createdAt (for ordering)
    await queryInterface.addIndex('Workplaces', ['createdAt'], {
      name: 'idx_workplaces_created_at'
    });
    
    // Composite index on Workplace for assignedExpertId and approvalStatus
    await queryInterface.addIndex('Workplaces', ['assignedExpertId', 'approvalStatus'], {
      name: 'idx_workplaces_expert_approval'
    });
    
    // Index on Workplace for riskLevel
    await queryInterface.addIndex('Workplaces', ['riskLevel'], {
      name: 'idx_workplaces_risk_level'
    });
    
    // Index on Visit table for expertId
    await queryInterface.addIndex('Visits', ['expertId'], {
      name: 'idx_visits_expert_id'
    });
    
    // Index on Visit table for workplaceId
    await queryInterface.addIndex('Visits', ['workplaceId'], {
      name: 'idx_visits_workplace_id'
    });
    
    // Composite index on Visit for expertId and visitMonth
    await queryInterface.addIndex('Visits', ['expertId', 'visitMonth'], {
      name: 'idx_visits_expert_month'
    });
    
    console.log('Indexes added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('Experts', 'idx_experts_organization_id');
    await queryInterface.removeIndex('Experts', 'idx_experts_created_at');
    await queryInterface.removeIndex('Workplaces', 'idx_workplaces_organization_id');
    await queryInterface.removeIndex('Workplaces', 'idx_workplaces_created_at');
    await queryInterface.removeIndex('Workplaces', 'idx_workplaces_expert_approval');
    await queryInterface.removeIndex('Workplaces', 'idx_workplaces_risk_level');
    await queryInterface.removeIndex('Visits', 'idx_visits_expert_id');
    await queryInterface.removeIndex('Visits', 'idx_visits_workplace_id');
    await queryInterface.removeIndex('Visits', 'idx_visits_expert_month');
    
    console.log('Indexes removed successfully');
  }
};