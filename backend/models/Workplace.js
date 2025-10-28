const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Organization = require('./Organization');

const Workplace = sequelize.define('Workplace', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sskRegistrationNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  taxOffice: {
    type: DataTypes.STRING,
    allowNull: false
  },
  taxNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'dangerous', 'veryDangerous'),
    allowNull: false
  },
  employeeCount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assignedExpertId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  assignedDoctorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  assignedDspId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  trackingExpertId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  approvalStatus: {
    type: DataTypes.ENUM('atama', 'bekliyor', 'onaylandi'),
    defaultValue: 'atama'
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

module.exports = Workplace;