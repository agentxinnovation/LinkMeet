const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Import routes
const apiRoutes = require('./app.js');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin:  "*",//||process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Create logs directory if it doesn't exist
const logsDir = process.env.LOGS_DIR || path.join(__dirname, 'logs');
// Ensure directory exists with proper permissions
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o777 });
  } else {
    fs.chmodSync(logsDir, 0o777);
  }
} catch (err) {
  console.error('❌ Could not setup logs directory, falling back to /tmp');
  logsDir = '/tmp/linkmeet-logs';
  fs.mkdirSync(logsDir, { recursive: true, mode: 0o777 });
}

// Database connection check
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test database with a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('🔍 Database query test passed');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// Helper function to clean logs older than 180 days
const cleanOldLogs = () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 180);
  
  fs.readdir(logsDir, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      if (file.startsWith('requests-') && file.endsWith('.log')) {
        const filePath = path.join(logsDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (stats.mtime < cutoffDate) {
            fs.unlink(filePath, (err) => {
              if (!err) {
                console.log(`🗑️  Cleaned old log file: ${file}`);
              }
            });
          }
        });
      }
    });
  });
};

// Clean old logs on startup and then daily
cleanOldLogs();
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000); // Run daily

// Custom logging middleware for detailed request/response logging
const detailedLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const clientIP = getClientIP(req);
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Capture request body
  const requestBody = req.body && Object.keys(req.body).length > 0 
    ? JSON.stringify(req.body) 
    : 'No body';
  
  // Store original json method to capture response
  const originalJson = res.json;
  let responseBody = '';
  
  res.json = function(body) {
    responseBody = JSON.stringify(body);
    return originalJson.call(this, body);
  };
  
  // Log when response finishes
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = res.statusCode;
    
    // Create log entry
    const logEntry = {
      timestamp,
      ip: clientIP,
      method,
      url,
      userAgent,
      requestBody,
      responseBody: responseBody || 'No response body',
      statusCode,
      duration: `${duration}ms`
    };
    
    // Format for file logging (pipe-separated for easy parsing)
    const fileLogEntry = [
      timestamp,
      clientIP,
      method,
      url,
      requestBody.replace(/\|/g, '\\|'), // Escape pipes in body
      responseBody.replace(/\|/g, '\\|'), // Escape pipes in response
      statusCode,
      `${duration}ms`,
      userAgent.replace(/\|/g, '\\|') // Escape pipes in user agent
    ].join(' | ') + '\n';
    
    // Daily log file name
    const today = new Date().toISOString().split('T')[0];
    const logFileName = `requests-${today}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    
    // Write to file (append mode)
    fs.appendFile(logFilePath, fileLogEntry, (err) => {
      if (err) {
        console.error('❌ Failed to write to log file:', err);
      }
    });
    
    // Console log for development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 ${method} ${url} - ${statusCode} - ${clientIP} - ${duration}ms`);
    }
  });
  
  next();
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: "*"||process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Standard Morgan logging to console
app.use(morgan('combined'));

// Our detailed logging middleware
app.use(detailedLogger);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbMessage = 'Database connection failed';
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
    dbMessage = 'Database is healthy';
  } catch (error) {
    console.error('Database health check failed:', error.message);
  }
  
  res.status(200).json({
    success: true,
    message: 'LinkMeet Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      message: dbMessage
    },
    websocket: {
      status: 'active',
      connectedClients: io.engine.clientsCount
    }
  });
});

// Logs endpoint to view recent logs (admin only in production)
app.get('/api/logs', (req, res) => {
  // In production, you should add proper authentication here
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const logFileName = `requests-${today}.log`;
  const logFilePath = path.join(logsDir, logFileName);
  
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({
        success: false,
        error: 'No logs found for today'
      });
    }
    
    const logs = data.trim().split('\n').slice(-50); // Last 50 entries
    const parsedLogs = logs.map(log => {
      const parts = log.split(' | ');
      return {
        timestamp: parts[0],
        ip: parts[1],
        method: parts[2],
        url: parts[3],
        requestBody: parts[4],
        responseBody: parts[5],
        statusCode: parts[6],
        duration: parts[7],
        userAgent: parts[8]
      };
    });
    
    res.json({
      success: true,
      data: parsedLogs,
      total: parsedLogs.length
    });
  });
});

// API routes
app.use('/api', apiRoutes);

// WebSocket Connection Handling
const connectedUsers = new Map(); // Store connected users
const roomUsers = new Map(); // Store users in rooms

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Store user connection
  socket.on('user-connected', (userData) => {
    connectedUsers.set(socket.id, userData);
    console.log(`👤 User ${userData.name || 'Anonymous'} connected with ID: ${socket.id}`);
  });

  // Handle joining a room
  socket.on('join-room', (data) => {
    const { roomId, userId, userName } = data;
    
    // Leave previous room if any
    const currentRoom = [...socket.rooms].find(room => room !== socket.id);
    if (currentRoom) {
      socket.leave(currentRoom);
      socket.to(currentRoom).emit('user-left', { 
        userId: socket.id, 
        userName: connectedUsers.get(socket.id)?.name || 'Anonymous' 
      });
    }
    
    // Join new room
    socket.join(roomId);
    
    // Store room info
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    roomUsers.get(roomId).set(socket.id, { userId, userName, socketId: socket.id });
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', { 
      userId: socket.id, 
      userName: userName || 'Anonymous',
      socketId: socket.id
    });
    
    // Send current room users to the new user
    const roomUsersList = Array.from(roomUsers.get(roomId).values());
    socket.emit('room-users', roomUsersList);
    
    console.log(`🏠 User ${userName || socket.id} joined room: ${roomId}`);
  });

  // Handle leaving a room
  socket.on('leave-room', (data) => {
    const { roomId } = data;
    const currentRoom = [...socket.rooms].find(room => room !== socket.id);
    
    if (currentRoom === roomId) {
      socket.leave(roomId);
      
      // Remove user from room tracking
      if (roomUsers.has(roomId)) {
        const userData = roomUsers.get(roomId).get(socket.id);
        roomUsers.get(roomId).delete(socket.id);
        
        // Clean up empty rooms
        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId);
        }
        
        // Notify others
        socket.to(roomId).emit('user-left', { 
          userId: socket.id, 
          userName: userData?.userName || 'Anonymous' 
        });
      }
      
      console.log(`🚪 User left room: ${roomId}`);
    }
  });

  // WebRTC Signaling Events
  socket.on('offer', (data) => {
    const { target, offer, roomId } = data;
    socket.to(target).emit('offer', {
      offer,
      sender: socket.id,
      roomId
    });
    console.log(`📡 Offer sent from ${socket.id} to ${target}`);
  });

  socket.on('answer', (data) => {
    const { target, answer, roomId } = data;
    socket.to(target).emit('answer', {
      answer,
      sender: socket.id,
      roomId
    });
    console.log(`📡 Answer sent from ${socket.id} to ${target}`);
  });

  socket.on('ice-candidate', (data) => {
    const { target, candidate, roomId } = data;
    socket.to(target).emit('ice-candidate', {
      candidate,
      sender: socket.id,
      roomId
    });
  });

  socket.on('ready', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('ready', {
      sender: socket.id,
      roomId
    });
    console.log(`✅ User ${socket.id} is ready in room ${roomId}`);
  });

  // Chat Events
  socket.on('message', (data) => {
    const { roomId, message, userName } = data;
    const messageData = {
      id: Date.now().toString(),
      message,
      userName: userName || 'Anonymous',
      userId: socket.id,
      timestamp: new Date().toISOString(),
      type: 'TEXT'
    };
    
    // Broadcast to room
    io.to(roomId).emit('message', messageData);
    console.log(`💬 Message in room ${roomId}: ${message}`);
  });

  socket.on('typing', (data) => {
    const { roomId, userName } = data;
    socket.to(roomId).emit('typing', { 
      userName: userName || 'Anonymous',
      userId: socket.id 
    });
  });

  socket.on('stop-typing', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('stop-typing', { userId: socket.id });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    // Clean up user from all rooms
    for (const [roomId, users] of roomUsers.entries()) {
      if (users.has(socket.id)) {
        const userData = users.get(socket.id);
        users.delete(socket.id);
        
        // Notify others in the room
        socket.to(roomId).emit('user-left', { 
          userId: socket.id, 
          userName: userData?.userName || 'Anonymous' 
        });
        
        // Clean up empty rooms
        if (users.size === 0) {
          roomUsers.delete(roomId);
        }
      }
    }
    
    // Remove from connected users
    connectedUsers.delete(socket.id);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('beforeExit', async () => {
  console.log('🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('📦 Database connection closed');
});

process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('🔌 WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('🔌 WebSocket server closed');
    process.exit(0);
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      console.log('⚠️  Starting server without database connection...');
    }
    
    server.listen(PORT, () => {
      console.log(`
🚀 LinkMeet Backend Server Started!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Health Check: http://localhost:${PORT}/health
📖 API Docs: http://localhost:${PORT}/api
🗃️  Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}
🔌 WebSocket: ✅ Active
🎥 WebRTC: ✅ Signaling Ready
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { app, server, io, prisma };