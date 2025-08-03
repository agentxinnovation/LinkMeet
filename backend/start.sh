#!/bin/sh

# Start Prisma Studio in background
npx prisma studio --port 5555 --hostname 0.0.0.0 &

# Start the main application
exec node server.js