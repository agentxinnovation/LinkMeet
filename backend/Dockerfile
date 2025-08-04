# Use Node.js LTS version
FROM node:18-alpine

# Install OpenSSL to fix Prisma warnings
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Use the existing node user (UID 1000, GID 1000)
# No need to create new user, node user already exists

# Create startup script and set permissions
COPY start.sh ./
RUN chmod +x start.sh

# Change ownership of the app directory (but NOT the logs directory - it will be mounted)
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose ports - 5000 for app, 5555 for Prisma Studio
EXPOSE 5000 5555

# Temporarily disable health check for debugging
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start both app and Prisma Studio
CMD ["./start.sh"]