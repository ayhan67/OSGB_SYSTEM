const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const organizationController = require('../controllers/organizationController');

const router = express.Router();

// Organization routes that don't require organization context (admin only)
router.get('/', organizationController.getAllOrganizations);
router.post('/', organizationController.createOrganization);

// Organization routes that require organization context
router.use(authMiddleware);
router.get('/:id', organizationController.getOrganizationById);
router.put('/:id', organizationController.updateOrganization);
router.delete('/:id', organizationController.deleteOrganization);
router.get('/:id/stats', organizationController.getOrganizationStats);

module.exports = router;