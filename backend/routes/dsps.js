const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const dspController = require('../controllers/dspController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// DSP routes
router.get('/', dspController.getAllDSPs);
router.get('/:id', dspController.getDSPById);
router.post('/', dspController.createDSP);
router.put('/:id', dspController.updateDSP);
router.delete('/:id', dspController.deleteDSP);

module.exports = router;