const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roomRoutes = require('./room.routes');
const messageRoutes = require('./message.routes');

// Setup routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);
router.use('/messages', messageRoutes);

module.exports = router;