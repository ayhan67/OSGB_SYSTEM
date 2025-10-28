const { sequelize, Expert, Doctor, Dsp, Workplace } = require('./models/index');

async function clearTestData() {
  try {
    // Clear all data from tables
    await Workplace.destroy({ where: {} });
    await Expert.destroy({ where: {} });
    await Doctor.destroy({ where: {} });
    await Dsp.destroy({ where: {} });
    
    console.log('All test data has been removed successfully!');
  } catch (error) {
    console.error('Error clearing test data:', error);
  } finally {
    await sequelize.close();
  }
}

clearTestData();