const express = require('express');
const router = express.Router();
const roomController = require('../../controllers/room.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Public rooms
router.get('/', protect, roomController.getPublicRooms);

// Room management
router.post('/', protect, roomController.createRoom);
router.get('/:id', protect, roomController.getRoom);
router.put('/:id', protect, roomController.updateRoom);
router.delete('/:id', protect, roomController.deleteRoom);

// Membership
router.post('/:id/join', protect, roomController.joinRoom);
router.post('/:id/leave', protect, roomController.leaveRoom);

// Members
router.get('/:id/members', protect, roomController.getRoomMembers);
router.put('/:id/members/:userId', protect, roomController.updateMemberRole);
router.delete('/:id/members/:userId', protect, roomController.removeMember);

module.exports = router;