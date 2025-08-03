#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple log viewer script
const viewLogs = (date = null, lines = 50) => {
  const logsDir = path.join(__dirname, '..', 'logs');
  const targetDate = date || new Date().toISOString().split('T')[0];
  const logFileName = `requests-${targetDate}.log`;
  const logFilePath = path.join(logsDir, logFileName);

  if (!fs.existsSync(logFilePath)) {
    console.log(`❌ No logs found for date: ${targetDate}`);
    console.log(`📁 Looking for: ${logFilePath}`);
    return;
  }

  try {
    const data = fs.readFileSync(logFilePath, 'utf8');
    const logLines = data.trim().split('\n');
    const recentLines = logLines.slice(-lines);

    console.log(`\n📊 Viewing last ${recentLines.length} entries from ${targetDate}\n`);
    console.log('━'.repeat(120));
    
    recentLines.forEach((line, index) => {
      const parts = line.split(' | ');
      if (parts.length >= 8) {
        const [timestamp, ip, method, url, , , statusCode, duration] = parts;
        const time = new Date(timestamp).toLocaleTimeString();
        const status = getStatusEmoji(parseInt(statusCode));
        
        console.log(`${status} ${time} | ${ip.padEnd(15)} | ${method.padEnd(6)} | ${statusCode} | ${duration.padEnd(8)} | ${url}`);
      }
    });
    
    console.log('━'.repeat(120));
    console.log(`\n📈 Total entries: ${logLines.length}`);
    
  } catch (error) {
    console.error('❌ Error reading log file:', error.message);
  }
};

const getStatusEmoji = (status) => {
  if (status >= 200 && status < 300) return '✅';
  if (status >= 300 && status < 400) return '🔄';
  if (status >= 400 && status < 500) return '⚠️';
  if (status >= 500) return '❌';
  return '❓';
};

// Parse command line arguments
const args = process.argv.slice(2);
const dateArg = args.find(arg => arg.match(/^\d{4}-\d{2}-\d{2}$/));
const linesArg = args.find(arg => arg.startsWith('--lines='));
const lines = linesArg ? parseInt(linesArg.split('=')[1]) : 50;

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📊 LinkMeet Log Viewer

Usage:
  node scripts/view-logs.js [date] [--lines=50]

Examples:
  node scripts/view-logs.js                    # Today's logs (last 50)
  node scripts/view-logs.js 2025-08-03        # Specific date
  node scripts/view-logs.js --lines=100       # Last 100 entries from today
  node scripts/view-logs.js 2025-08-03 --lines=200  # Last 200 from specific date

Options:
  --lines=N    Number of recent entries to show (default: 50)
  --help, -h   Show this help message
`);
  process.exit(0);
}

viewLogs(dateArg, lines);   