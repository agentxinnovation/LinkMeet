const { prisma } = require('../config/database');

// Get room messages
const getRoomMessages = async (req, res) => {
  try {
    // Check if user is room member
    const isMember = await prisma.roomMember.findFirst({
      where: {
        roomId: req.params.roomId,
        userId: req.user.id
      }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view messages in this room'
      });
    }

    const messages = await prisma.message.findMany({
      where: { roomId: req.params.roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to 100 most recent messages
    });

    res.json({
      success: true,
      count: messages.length,
      data: messages.reverse() // Return oldest first
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
};

// Send message to room
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    // Check if user is room member
    const isMember = await prisma.roomMember.findFirst({
      where: {
        roomId: req.params.roomId,
        userId: req.user.id
      }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send messages in this room'
      });
    }

    const message = await prisma.message.create({
      data: {
        content,
        roomId: req.params.roomId,
        userId: req.user.id,
        type: 'TEXT'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Real-time broadcast would happen here via Socket.IO
    // io.to(req.params.roomId).emit('new_message', message);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: {
        room: {
          include: {
            members: {
              where: { userId: req.user.id },
              select: { role: true }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check permissions: author, moderator, or owner
    const isAuthor = message.userId === req.user.id;
    const userRole = message.room.members[0]?.role;
    const isModeratorOrOwner = ['OWNER', 'MODERATOR'].includes(userRole);

    if (!isAuthor && !isModeratorOrOwner) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    await prisma.message.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
};

module.exports = {
  getRoomMessages,
  sendMessage,
  deleteMessage
};