const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/message.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Get room messages
router.get('/room/:roomId', protect, messageController.getRoomMessages);

// Send message
router.post('/room/:roomId', protect, messageController.sendMessage);

// Delete message
router.delete('/:id', protect, messageController.deleteMessage);

module.exports = router;