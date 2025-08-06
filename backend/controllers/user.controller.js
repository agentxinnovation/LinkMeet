const { prisma } = require('../config/database');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isOnline: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isOnline: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
};

// Update user online status
const updateUserStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    // Users can only update their own status unless admin
    if (req.params.id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this user'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isOnline },
      select: {
        id: true,
        email: true,
        name: true,
        isOnline: true
      }
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserStatus
};