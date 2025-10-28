const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const doctorController = require('../controllers/doctorController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Doctor routes
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/assigned-workplaces', doctorController.getAssignedWorkplaces);
router.post('/', doctorController.createDoctor);
router.put('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;