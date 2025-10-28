const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const expertController = require('../controllers/expertController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Expert routes
router.get('/', cacheMiddleware, expertController.getAllExperts);
router.get('/:id', cacheMiddleware, expertController.getExpertById);
router.get('/:id/assigned-workplaces', cacheMiddleware, expertController.getAssignedWorkplaces);
router.post('/', expertController.createExpert);
router.put('/:id', expertController.updateExpert);
router.delete('/:id', expertController.deleteExpert);
router.get('/:expertId/visit-summary', cacheMiddleware, expertController.getVisitSummary);
router.get('/:expertId/visits', cacheMiddleware, expertController.getVisits);

module.exports = router;