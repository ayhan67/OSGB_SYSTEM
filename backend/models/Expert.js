const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Organization = require('./Organization');

const Expert = sequelize.define('Expert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expertiseClass: {
    type: DataTypes.ENUM('A', 'B', 'C'),
    allowNull: false
  },
  assignedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  usedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Organization,
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Method to check if expert has enough minutes for a workplace
Expert.prototype.hasEnoughMinutes = function(riskLevel, employeeCount) {
  // Calculate required minutes based on risk level and employee count
  let requiredMinutes = 0;
  switch (riskLevel) {
    case 'low':
      requiredMinutes = employeeCount * 10;
      break;
    case 'dangerous':
      requiredMinutes = employeeCount * 20;
      break;
    case 'veryDangerous':
      requiredMinutes = employeeCount * 40;
      break;
  }
  
  // Check if expert has enough minutes (assigned minutes should be >= required minutes)
  return this.assignedMinutes >= requiredMinutes;
};

module.exports = Expert;