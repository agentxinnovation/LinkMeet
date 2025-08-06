const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// Admin routes
router.get('/', protect, authorize('ADMIN'), userController.getUsers);

// Protected routes
router.get('/:id', protect, userController.getUser);
router.put('/:id/status', protect, userController.updateUserStatus);

module.exports = router;