const express = require('express');
const systemConfigController = require('../controllers/systemConfigController');
const jwtAuthMiddleware = require('../middleware/jwtAuthMiddleware');

const router = express.Router();

// All routes require authentication
router.use(jwtAuthMiddleware);

// Get all system configurations
router.get('/', systemConfigController.getAllConfig);

// Get system configuration by key
router.get('/:key', systemConfigController.getConfigByKey);

// Create or update system configuration
router.post('/', systemConfigController.upsertConfig);

// Delete system configuration
router.delete('/:key', systemConfigController.deleteConfig);

module.exports = router;