const { sequelize } = require('./models/index');

async function updateUserOrganization() {
  try {
    // Update the user with ID 1 to have organizationId 1
    const result = await sequelize.query(
      "UPDATE Users SET organizationId = 1 WHERE id = 1"
    );
    
    console.log('User organization updated successfully:', result);
  } catch (error) {
    console.error('Error updating user organization:', error);
  } finally {
    await sequelize.close();
  }
}

updateUserOrganization();