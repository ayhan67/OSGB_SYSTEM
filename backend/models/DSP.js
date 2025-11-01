const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Organization = require('./Organization');

const Dsp = sequelize.define('Dsp', {
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

// Method to check if DSP has enough minutes for a workplace
Dsp.prototype.hasEnoughMinutes = function(riskLevel, employeeCount) {
  // DSP only works with very dangerous workplaces with more than 10 employees
  if (riskLevel !== 'veryDangerous' || employeeCount <= 10) {
    return false;
  }
  
  // Calculate required minutes for DSP (5 minutes per employee)
  const requiredMinutes = employeeCount * 5;
  
  // Check if DSP has enough minutes (assigned minutes should be >= required minutes)
  return this.assignedMinutes >= requiredMinutes;
};

module.exports = Dsp;