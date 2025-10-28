const { sequelize, Expert, Doctor, Dsp, Workplace } = require('./models/index');

async function retrieveData() {
  try {
    console.log('Retrieving all data from the database...\n');
    
    // Retrieve all experts
    const experts = await Expert.findAll();
    console.log('Experts:');
    if (experts.length === 0) {
      console.log('  No experts found.');
    } else {
      experts.forEach(expert => {
        console.log(`  - ${expert.firstName} ${expert.lastName} (${expert.expertiseClass}) - Phone: ${expert.phone}`);
      });
    }
    console.log();
    
    // Retrieve all doctors
    const doctors = await Doctor.findAll();
    console.log('Doctors:');
    if (doctors.length === 0) {
      console.log('  No doctors found.');
    } else {
      doctors.forEach(doctor => {
        console.log(`  - ${doctor.firstName} ${doctor.lastName} - Phone: ${doctor.phone}`);
      });
    }
    console.log();
    
    // Retrieve all DSPs
    const dsps = await Dsp.findAll();
    console.log('DSPs:');
    if (dsps.length === 0) {
      console.log('  No DSPs found.');
    } else {
      dsps.forEach(dsp => {
        console.log(`  - ${dsp.firstName} ${dsp.lastName} - Phone: ${dsp.phone}`);
      });
    }
    console.log();
    
    // Retrieve all workplaces
    const workplaces = await Workplace.findAll({
      include: [
        { model: Expert, as: 'Expert', attributes: ['firstName', 'lastName'] },
        { model: Doctor, as: 'Doctor', attributes: ['firstName', 'lastName'] },
        { model: Dsp, as: 'Dsp', attributes: ['firstName', 'lastName'] }
      ]
    });
    
    console.log('Workplaces:');
    if (workplaces.length === 0) {
      console.log('  No workplaces found.');
    } else {
      workplaces.forEach(workplace => {
        console.log(`  - ${workplace.name}`);
        console.log(`    Address: ${workplace.address}`);
        console.log(`    SSK Registration: ${workplace.sskRegistrationNo}`);
        console.log(`    Tax Office: ${workplace.taxOffice}`);
        console.log(`    Tax Number: ${workplace.taxNumber}`);
        console.log(`    Price: ${workplace.price}`);
        console.log(`    Risk Level: ${workplace.riskLevel}`);
        console.log(`    Employee Count: ${workplace.employeeCount}`);
        console.log(`    Source: ${workplace.source}`);
        console.log(`    Approval Status: ${workplace.approvalStatus}`);
        
        if (workplace.Expert) {
          console.log(`    Assigned Expert: ${workplace.Expert.firstName} ${workplace.Expert.lastName}`);
        }
        
        if (workplace.Doctor) {
          console.log(`    Assigned Doctor: ${workplace.Doctor.firstName} ${workplace.Doctor.lastName}`);
        }
        
        if (workplace.Dsp) {
          console.log(`    Assigned DSP: ${workplace.Dsp.firstName} ${workplace.Dsp.lastName}`);
        }
        console.log();
      });
    }
    
  } catch (error) {
    console.error('Error retrieving data:', error);
  } finally {
    await sequelize.close();
  }
}

retrieveData();