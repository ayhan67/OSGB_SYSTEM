const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const visitController = require('../controllers/visitController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Visit routes
router.get('/', visitController.getAllVisits);
router.get('/:id', visitController.getVisitById);
router.post('/', visitController.createVisit);
router.put('/:id', visitController.updateVisit);
router.delete('/:id', visitController.deleteVisit);
router.get('/expert/:expertId', visitController.getVisitsByExpert);
router.get('/workplace/:workplaceId', visitController.getVisitsByWorkplace);
router.get('/month/:month', visitController.getVisitsByMonth);

module.exports = router;