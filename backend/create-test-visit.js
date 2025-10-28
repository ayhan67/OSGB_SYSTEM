const { Visit } = require('./models');

async function createTestVisit() {
  try {
    const visit = await Visit.create({
      expertId: 1,
      workplaceId: 1,
      visitMonth: '2025-10',
      organizationId: 1
    });
    console.log('Test visit created:', visit.toJSON());
  } catch (error) {
    console.error('Error creating test visit:', error);
  }
}

createTestVisit();