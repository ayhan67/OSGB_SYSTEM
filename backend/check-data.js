const { Sequelize, DataTypes } = require('sequelize');

// Connect to the existing SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

// Define models
const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
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
  tableName: 'Organizations',
  timestamps: true
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: true
});

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
    type: DataTypes.ENUM('atama', 'onay', 'onaylandi'),
    defaultValue: 'atama'
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Workplaces',
  timestamps: true
});

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models
    await sequelize.sync({ force: false });
    
    // Check organizations
    console.log('\n--- Organizations ---');
    const organizations = await Organization.findAll();
    organizations.forEach(org => {
      console.log(`ID: ${org.id}, Name: ${org.name}, Email: ${org.email}`);
    });
    
    // Check users
    console.log('\n--- Users ---');
    const users = await User.findAll();
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Org ID: ${user.organizationId}`);
    });
    
    // Check workplaces
    console.log('\n--- Workplaces ---');
    const workplaces = await Workplace.findAll();
    workplaces.forEach(workplace => {
      console.log(`ID: ${workplace.id}, Name: ${workplace.name}, Risk Level: ${workplace.riskLevel}, Employee Count: ${workplace.employeeCount}`);
    });
    
    console.log('\nTotal Organizations:', organizations.length);
    console.log('Total Users:', users.length);
    console.log('Total Workplaces:', workplaces.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkData();