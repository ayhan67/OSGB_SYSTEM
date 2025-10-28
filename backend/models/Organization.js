const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValidTurkishMobile(value) {
        if (value) {
          // Remove all spaces and check if it's a valid Turkish mobile number
          const cleanValue = value.replace(/\s/g, '');
          if (!/^5\d{9}$/.test(cleanValue)) {
            throw new Error('Telefon numarası 5xx xxx xx xx formatında olmalıdır');
          }
        }
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  taxNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  taxOffice: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Organization;