const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Organization = require('./Organization');

const Doctor = sequelize.define('Doctor', {
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

// Method to check if doctor has enough minutes for a workplace
Doctor.prototype.hasEnoughMinutes = function(riskLevel, employeeCount) {
  // Calculate required minutes based on risk level and employee count
  let requiredMinutes = 0;
  switch (riskLevel) {
    case 'low':
      requiredMinutes = employeeCount * 5;
      break;
    case 'dangerous':
      requiredMinutes = employeeCount * 10;
      break;
    case 'veryDangerous':
      requiredMinutes = employeeCount * 15;
      break;
  }
  
  // Check if doctor has enough minutes (assigned minutes should be >= required minutes)
  return this.assignedMinutes >= requiredMinutes;
};

module.exports = Doctor;