#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const cleanOldLogs = (daysToKeep = 180, dryRun = false) => {
  const logsDir = path.join(__dirname, '..', 'logs');
  
  if (!fs.existsSync(logsDir)) {
    console.log('📁 Logs directory does not exist');
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  console.log(`\n🧹 Cleaning logs older than ${daysToKeep} days (before ${cutoffDate.toDateString()})`);
  console.log(`📁 Scanning directory: ${logsDir}`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN - No files will be deleted\n');
  }

  fs.readdir(logsDir, (err, files) => {
    if (err) {
      console.error('❌ Error reading logs directory:', err);
      return;
    }

    const logFiles = files.filter(file => 
      file.startsWith('requests-') && file.endsWith('.log')
    );

    if (logFiles.length === 0) {
      console.log('📄 No log files found');
      return;
    }

    let deletedCount = 0;
    let totalSize = 0;

    logFiles.forEach(file => {
      const filePath = path.join(logsDir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`❌ Error checking file ${file}:`, err);
          return;
        }

        const fileAge = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24));
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        if (stats.mtime < cutoffDate) {
          totalSize += stats.size;
          
          if (dryRun) {
            console.log(`🗑️  Would delete: ${file} (${fileSizeMB} MB, ${fileAge} days old)`);
            deletedCount++;
          } else {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`❌ Failed to delete ${file}:`, err);
              } else {
                console.log(`🗑️  Deleted: ${file} (${fileSizeMB} MB, ${fileAge} days old)`);
                deletedCount++;
              }
            });
          }
        } else {
          console.log(`📄 Keeping: ${file} (${fileSizeMB} MB, ${fileAge} days old)`);
        }
      });
    });

    // Summary after a short delay to allow file operations to complete
    setTimeout(() => {
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      console.log(`\n📊 Summary:`);
      console.log(`   Files processed: ${logFiles.length}`);
      console.log(`   Files ${dryRun ? 'would be ' : ''}deleted: ${deletedCount}`);
      console.log(`   Space ${dryRun ? 'would be ' : ''}freed: ${totalSizeMB} MB`);
      
      if (dryRun) {
        console.log(`\n💡 Run without --dry-run to actually delete files`);
      }
    }, 1000);
  });
};

// Parse command line arguments
const args = process.argv.slice(2);
const daysArg = args.find(arg => arg.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1]) : 180;
const dryRun = args.includes('--dry-run');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧹 LinkMeet Log Cleaner

Usage:
  node scripts/clean-logs.js [options]

Options:
  --days=N      Days to keep (default: 180)
  --dry-run     Show what would be deleted without actually deleting
  --help, -h    Show this help message

Examples:
  node scripts/clean-logs.js                    # Clean logs older than 180 days
  node scripts/clean-logs.js --days=90          # Clean logs older than 90 days
  node scripts/clean-logs.js --dry-run          # Preview what would be deleted
  node scripts/clean-logs.js --days=30 --dry-run  # Preview 30-day cleanup
`);
  process.exit(0);
}

cleanOldLogs(days, dryRun);