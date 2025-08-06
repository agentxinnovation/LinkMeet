const fs = require('fs');
const path = require('path');
const { LOGS_DIR } = require('../config/constants');

const setupLogsDirectory = () => {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true, mode: 0o777 });
    } else {
      fs.chmodSync(LOGS_DIR, 0o777);
    }
  } catch (err) {
    console.error('❌ Could not setup logs directory, falling back to /tmp');
    logsDir = '/tmp/linkmeet-logs';
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o777 });
  }
};

const cleanOldLogs = () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 180);
  
  fs.readdir(LOGS_DIR, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      if (file.startsWith('requests-') && file.endsWith('.log')) {
        const filePath = path.join(LOGS_DIR, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (stats.mtime < cutoffDate) {
            fs.unlink(filePath, (err) => {
              if (!err) console.log(`🗑️  Cleaned old log file: ${file}`);
            });
          }
        });
      }
    });
  });
};

const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
  req.connection.remoteAddress || 
  req.socket.remoteAddress ||
  (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
  req.ip;
};

const detailedLogger = (req, res, next) => {
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const clientIP = getClientIP(req);
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  const requestBody = req.body && Object.keys(req.body).length > 0 
  ? JSON.stringify(req.body) 
  : 'No body';
  
  const originalJson = res.json;
  let responseBody = '';
  
  res.json = function(body) {
    responseBody = JSON.stringify(body);
    return originalJson.call(this, body);
  };
  
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = res.statusCode;
    
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
    
    const fileLogEntry = [
      timestamp,
      clientIP,
      method,
      url,          // Original URL path
      fullUrl,      // Full URL including protocol and host
      requestBody.replace(/\|/g, '\\|'),
      responseBody.replace(/\|/g, '\\|'),
      statusCode,
      `${duration}ms`,
      userAgent.replace(/\|/g, '\\|')
    ].join(' | ') + '\n';

    
    const today = new Date().toISOString().split('T')[0];
    const logFileName = `requests-${today}.log`;
    const logFilePath = path.join(LOGS_DIR, logFileName);
    
    fs.appendFile(logFilePath, fileLogEntry, (err) => {
      if (err) {
        console.error('❌ Failed to write to log file:', err);
      }
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 ${method} ${url} - ${statusCode} - ${clientIP} - ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  setupLogsDirectory,
  cleanOldLogs,
  getClientIP,
  detailedLogger
};