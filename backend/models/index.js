const sequelize = require('../config/database');
const Expert = require('./Expert');
const Doctor = require('./Doctor');
const Dsp = require('./DSP');
const Workplace = require('./Workplace');
const Visit = require('./Visit');
const Organization = require('./Organization');
const User = require('./User');

// Define associations
Workplace.belongsTo(Expert, { foreignKey: 'assignedExpertId', as: 'Expert' });
Workplace.belongsTo(Doctor, { foreignKey: 'assignedDoctorId', as: 'Doctor' });
Workplace.belongsTo(Dsp, { foreignKey: 'assignedDspId', as: 'Dsp' });
Workplace.belongsTo(Expert, { foreignKey: 'trackingExpertId', as: 'TrackingExpert' });

Expert.hasMany(Workplace, { foreignKey: 'assignedExpertId', as: 'Workplaces' });
Doctor.hasMany(Workplace, { foreignKey: 'assignedDoctorId', as: 'Workplaces' });
Dsp.hasMany(Workplace, { foreignKey: 'assignedDspId', as: 'Workplaces' });
Expert.hasMany(Workplace, { foreignKey: 'trackingExpertId', as: 'TrackedWorkplaces' });

Expert.hasMany(Visit, { foreignKey: 'expertId' });
Workplace.hasMany(Visit, { foreignKey: 'workplaceId' });
Visit.belongsTo(Expert, { foreignKey: 'expertId' });
Visit.belongsTo(Workplace, { foreignKey: 'workplaceId' });

// Organization associations
Organization.hasMany(Expert, { foreignKey: 'organizationId' });
Expert.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Doctor, { foreignKey: 'organizationId' });
Doctor.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Dsp, { foreignKey: 'organizationId' });
Dsp.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Workplace, { foreignKey: 'organizationId' });
Workplace.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Visit, { foreignKey: 'organizationId' });
Visit.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(User, { foreignKey: 'organizationId' });
User.belongsTo(Organization, { foreignKey: 'organizationId' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  Expert,
  Doctor,
  Dsp,
  Workplace,
  Visit,
  Organization,
  User
};