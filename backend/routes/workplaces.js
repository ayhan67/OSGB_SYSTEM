const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const workplaceController = require('../controllers/workplaceController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Workplace routes
router.get('/', cacheMiddleware, workplaceController.getAllWorkplaces);
router.get('/:id', cacheMiddleware, workplaceController.getWorkplaceById);
router.post('/', workplaceController.createWorkplace);
router.put('/:id', workplaceController.updateWorkplace);
router.delete('/:id', workplaceController.deleteWorkplace);
router.get('/approval-status/:status', cacheMiddleware, workplaceController.getWorkplacesByApprovalStatus);
router.get('/expert/:expertId', cacheMiddleware, workplaceController.getWorkplacesByExpert);
router.get('/doctor/:doctorId', cacheMiddleware, workplaceController.getWorkplacesByDoctor);
router.get('/dsp/:dspId', cacheMiddleware, workplaceController.getWorkplacesByDsp);

module.exports = router;