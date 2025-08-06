const path = require('path');

module.exports = {
  CORS_OPTIONS: {
    origin: "*" || process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  SOCKET_OPTIONS: {
    cors: {
      origin: "*" || process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  },
  LOGS_DIR: process.env.LOGS_DIR || path.join(__dirname, '../logs'),
};