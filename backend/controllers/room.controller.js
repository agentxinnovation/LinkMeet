const { prisma } = require('../config/database');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Get all public rooms
const getPublicRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isPublic: true },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms'
    });
  }
};

// Create new room
const createRoom = async (req, res) => {
  try {
    const { name, description, isPublic, password } = req.body;

    const room = await prisma.room.create({
      data: {
        name,
        description,
        isPublic,
        password: password ? await bcrypt.hash(password, 10) : null,
        ownerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room'
    });
  }
};

// Get room details
const getRoom = async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check if room is private and user is member
    if (!room.isPublic) {
      const isMember = room.members.some(m => m.userId === req.user.id);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this room'
        });
      }
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room'
    });
  }
};

// Update room (owner only)
const updateRoom = async (req, res) => {
  try {
    const { name, description, isPublic, password } = req.body;

    // Verify ownership
    const room = await prisma.room.findUnique({
      where: { id: req.params.id }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    if (room.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this room'
      });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        isPublic,
        password: password ? await bcrypt.hash(password, 10) : room.password
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedRoom
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update room'
    });
  }
};

// Delete room (owner only)
const deleteRoom = async (req, res) => {
  try {
    // Verify ownership
    const room = await prisma.room.findUnique({
      where: { id: req.params.id }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    if (room.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this room'
      });
    }

    await prisma.room.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete room'
    });
  }
};

// Join room
const joinRoom = async (req, res) => {
  try {
    const { password } = req.body;
    const roomId = req.params.id;

    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check if already member
    const existingMember = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId: req.user.id
      }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this room'
      });
    }

    // Check password if room is private
    if (!room.isPublic) {
      if (!password) {
        return res.status(401).json({
          success: false,
          error: 'Password required for private room'
        });
      }

      const passwordMatch = await bcrypt.compare(password, room.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid room password'
        });
      }
    }

    // Add user to room
    await prisma.roomMember.create({
      data: {
        roomId,
        userId: req.user.id,
        role: 'PARTICIPANT'
      }
    });

    res.status(201).json({
      success: true,
      data: {
        roomId,
        userId: req.user.id,
        role: 'PARTICIPANT'
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join room'
    });
  }
};

// Leave room
const leaveRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    // Verify membership
    const membership = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId
      }
    });

    if (!membership) {
      return res.status(400).json({
        success: false,
        error: 'Not a member of this room'
      });
    }

    // Owner can't leave, must delete room
    if (membership.role === 'OWNER') {
      return res.status(403).json({
        success: false,
        error: 'Room owner must delete room instead of leaving'
      });
    }

    await prisma.roomMember.delete({
      where: { id: membership.id }
    });

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave room'
    });
  }
};

// Get room members
const getRoomMembers = async (req, res) => {
  try {
    const members = await prisma.roomMember.findMany({
      where: { roomId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true
          }
        }
      },
      orderBy: {
        role: 'desc' // OWNER first, then MODERATOR, then PARTICIPANT
      }
    });

    res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room members'
    });
  }
};

// Update member role
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id: roomId, userId } = req.params;

    // Verify requester is owner or moderator
    const requester = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId: req.user.id
      }
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'MODERATOR')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update roles'
      });
    }

    // Can't change owner's role
    const targetMember = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId
      }
    });

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    if (targetMember.role === 'OWNER') {
      return res.status(403).json({
        success: false,
        error: 'Cannot change owner role'
      });
    }

    // Moderators can only change participants
    if (requester.role === 'MODERATOR' && targetMember.role !== 'PARTICIPANT') {
      return res.status(403).json({
        success: false,
        error: 'Moderators can only change participant roles'
      });
    }

    const updatedMember = await prisma.roomMember.update({
      where: { id: targetMember.id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedMember
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member role'
    });
  }
};

// Remove member
const removeMember = async (req, res) => {
  try {
    const { id: roomId, userId } = req.params;

    // Verify requester is owner or moderator
    const requester = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId: req.user.id
      }
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'MODERATOR')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to remove members'
      });
    }

    // Can't remove owner
    const targetMember = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId
      }
    });

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    if (targetMember.role === 'OWNER') {
      return res.status(403).json({
        success: false,
        error: 'Cannot remove room owner'
      });
    }

    // Moderators can only remove participants
    if (requester.role === 'MODERATOR' && targetMember.role !== 'PARTICIPANT') {
      return res.status(403).json({
        success: false,
        error: 'Moderators can only remove participants'
      });
    }

    await prisma.roomMember.delete({
      where: { id: targetMember.id }
    });

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member'
    });
  }
};

module.exports = {
  getPublicRooms,
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  updateMemberRole,
  removeMember
};