# LinkMeet API Documentation

## Overview
LinkMeet is an open-source video conferencing platform backend built with Express.js, Prisma ORM, and PostgreSQL.

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-domain.com`

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Available Routes

### 🔐 Authentication Routes
**Base Path:** `/api/auth`

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| POST | `/register` | Register a new user | ❌ |
| POST | `/login` | Login user | ❌ |
| POST | `/logout` | Logout user | ✅ |
| GET | `/me` | Get current user profile | ✅ |
| PUT | `/profile` | Update user profile | ✅ |

### 👥 User Routes
**Base Path:** `/api/users`

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| GET | `/` | Get all users (for admin) | ✅ |
| GET | `/:id` | Get user by ID | ✅ |
| PUT | `/:id/status` | Update user online status | ✅ |

### 🏠 Room Routes
**Base Path:** `/api/rooms`

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| GET | `/` | Get all public rooms | ✅ |
| POST | `/` | Create a new room | ✅ |
| GET | `/:id` | Get room details | ✅ |
| PUT | `/:id` | Update room (owner only) | ✅ |
| DELETE | `/:id` | Delete room (owner only) | ✅ |
| POST | `/:id/join` | Join a room | ✅ |
| POST | `/:id/leave` | Leave a room | ✅ |
| GET | `/:id/members` | Get room members | ✅ |
| PUT | `/:id/members/:userId` | Update member role (owner/mod only) | ✅ |
| DELETE | `/:id/members/:userId` | Remove member (owner/mod only) | ✅ |

### 💬 Message Routes
**Base Path:** `/api/messages`

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| GET | `/room/:roomId` | Get room messages | ✅ |
| POST | `/room/:roomId` | Send message to room | ✅ |
| DELETE | `/:id` | Delete message (author/mod/owner only) | ✅ |

### 🏥 Health & System Routes
**Base Path:** `/`

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| GET | `/health` | Health check endpoint | ❌ |
| GET | `/api/stats` | Get system statistics | ✅ |

## WebSocket Events (Socket.IO)

### Connection Events
- `connection` - User connects to socket
- `disconnect` - User disconnects from socket

### Room Events
- `join-room` - Join a video room
- `leave-room` - Leave a video room
- `user-joined` - Broadcast when user joins
- `user-left` - Broadcast when user leaves

### WebRTC Signaling Events
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Exchange ICE candidates
- `ready` - Signal ready for connection

### Chat Events
- `message` - Send/receive chat messages
- `typing` - User typing indicator
- `stop-typing` - Stop typing indicator

## Error Handling
All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {...}
}
```

## HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting
- Authentication endpoints: 5 requests per minute
- General API: 100 requests per minute
- WebSocket connections: 10 per minute

## CORS Policy
The API accepts requests from:
- Development: `http://localhost:3000`
- Production: Your configured frontend domain

## Database Schema

### User
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `name` (String)
- `password` (String, Hashed)
- `avatar` (String, Optional)
- `isOnline` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Room
- `id` (UUID, Primary Key)
- `name` (String)
- `description` (String, Optional)
- `isPublic` (Boolean)
- `password` (String, Optional)
- `maxUsers` (Integer)
- `isActive` (Boolean)
- `ownerId` (UUID, Foreign Key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### RoomMember
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `roomId` (UUID, Foreign Key)
- `role` (Enum: OWNER, MODERATOR, PARTICIPANT)
- `joinedAt` (DateTime)

### Message
- `id` (UUID, Primary Key)
- `content` (String)
- `type` (Enum: TEXT, SYSTEM, JOIN, LEAVE)
- `userId` (UUID, Foreign Key)
- `roomId` (UUID, Foreign Key)
- `createdAt` (DateTime)

## Environment Variables
See `.env.sample` for required environment variables.

## Development Setup
1. Install dependencies: `npm install`
2. Set up environment: Copy `.env.sample` to `.env`
3. Run Prisma migrations: `npm run prisma:migrate`
4. Generate Prisma client: `npm run prisma:generate`
5. Start development server: `npm run dev`

## Docker Setup
1. Build and run: `docker-compose up -d`
2. Run migrations: `docker exec linkmeet-backend npx prisma migrate deploy`

---
*This documentation is generated for LinkMeet v1.0.0*