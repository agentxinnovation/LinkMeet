const { prisma } = require('../config/database');
const { LOGS_DIR } = require('../config/constants');
const fs = require('fs');
const path = require('path');

// Health check handler
const healthCheck = async (req, res) => {
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
    links: {
      healthCheck: `${req.protocol}://${req.get('host')}/health`,
      apiDocs: `${req.protocol}://${req.get('host')}/api-docs`,
      logs: `${req.protocol}://${req.get('host')}/api/logs`
    }
  });
};

// Logs handler
const getLogs = (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const logFileName = `requests-${today}.log`;
  const logFilePath = path.join(LOGS_DIR, logFileName);
  
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({
        success: false,
        error: 'No logs found for today'
      });
    }
    
    const logs = data.trim().split('\n').slice(-50);
    const parsedLogs = logs.map(log => {
      const parts = log.split(' | ');
      return {
        timestamp: parts[0],
        ip: parts[1],
        method: parts[2],
        url: parts[3],
        fullUrl: parts[4],
        requestBody: parts[5] !== 'No body' ? JSON.parse(parts[5].replace(/\\\|/g, '|')) : null,
        responseBody: parts[6] !== 'No response body' ? JSON.parse(parts[6].replace(/\\\|/g, '|')) : null,
        statusCode: parts[7],
        duration: parts[8],
        userAgent: parts[9]
      };
    });
    
    res.json({
      success: true,
      data: parsedLogs,
      total: parsedLogs.length,
      links: {
        currentLogFile: `${req.protocol}://${req.get('host')}/api/logs`,
        healthCheck: `${req.protocol}://${req.get('host')}/health`
      }
    });
  });
};

module.exports = {
  healthCheck,
  getLogs
};