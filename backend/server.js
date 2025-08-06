require('dotenv').config();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// Configurations
const configureServer = require('./config/server');
const { connectDB, disconnectDB } = require('./config/database');
const { SOCKET_OPTIONS } = require('./config/constants');
const { setupLogsDirectory, cleanOldLogs, detailedLogger } = require('./middlewares/logger');
const { configureSocket } = require('./services/socket.service');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const routes = require('./routes');

// Initialize app and server
const app = configureServer();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = new Server(server, SOCKET_OPTIONS);
configureSocket(io);


// Setup logs
setupLogsDirectory();
cleanOldLogs();
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

// Add detailed logger middleware
app.use(detailedLogger);

// Routes
app.use(routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const shutdown = async () => {
  console.log('🔄 Shutting down gracefully...');
  await disconnectDB();
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0);
  });
};

process.on('beforeExit', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const startServer = async () => {
  try {
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      console.log('⚠️  Starting server without database connection...');
    }
    
    server.listen(PORT, () => {
      console.log(`
🚀 LinkMeet Backend Server Started!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };