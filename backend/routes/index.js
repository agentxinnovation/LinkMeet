const express = require('express');
const router = express.Router();
const { healthCheck, getLogs } = require('../controllers/system.controller');

// System routes
router.get('/health', healthCheck);
router.get('/logs', getLogs);

// API routes
// router.use('/api', apiRoutes); // Uncomment when you have API routes

module.exports = router;