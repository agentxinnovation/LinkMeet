const express = require('express');
const router = express.Router();
const { healthCheck, getLogs } = require('../controllers/system.controller');
const apiRoutes = require('./api');

// System routes
router.get('/health', healthCheck);
router.get('/api/logs', getLogs);

// API routes
router.use('/api', apiRoutes); 

module.exports = router;