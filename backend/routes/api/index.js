const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth.routes.js');
const userRoutes = require('./user.routes.js');
const roomRoutes = require('./room.routes.js');
const messageRoutes = require('./message.routes.js');

// Setup routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);
router.use('/messages', messageRoutes);

module.exports = router;