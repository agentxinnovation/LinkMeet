const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    }
  });
});

// Hello World route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to LinkMeet API! 🎥',
    version: '1.0.0',
    author: 'Harsh Raithatha'
  });
});

// API base route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'LinkMeet API v1.0.0',
    docs: '/docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      rooms: '/api/rooms',
      messages: '/api/messages'
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
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      console.log('⚠️  Starting server without database connection...');
    }

    app.listen(PORT, () => {
      console.log(`
🚀 LinkMeet Backend Server Started!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Health Check: http://localhost:${PORT}/health
📖 API Docs: http://localhost:${PORT}/api
🗃️  Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}
      `);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;