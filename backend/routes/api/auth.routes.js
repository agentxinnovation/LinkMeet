const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', protect, authController.logout);

// GET /api/auth/me
router.get('/me', protect, authController.getProfile);

// PUT /api/auth/profile
router.put('/profile', protect, authController.updateProfile);

module.exports = router;