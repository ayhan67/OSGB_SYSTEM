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

module.exports = Expert;