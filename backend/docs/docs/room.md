Here's the complete **Room API Documentation** in Markdown format with all endpoints, request/response examples, and testing scenarios:

```markdown
# LinkMeet Room API Documentation

## Base URL
`https://api.linkmeet.com/`  
*or*  
`http://localhost:5000` (for development)

---

## 📋 Table of Contents
1. [Authentication](#-authentication)
2. [Room Endpoints](#-room-endpoints)
   - [Get Public Rooms](#get-public-rooms)
   - [Create Room](#create-room)
   - [Get Room Details](#get-room-details)
   - [Update Room](#update-room)
   - [Delete Room](#delete-room)
   - [Join Room](#join-room)
   - [Leave Room](#leave-room)
   - [Get Room Members](#get-room-members)
   - [Update Member Role](#update-member-role)
   - [Remove Member](#remove-member)
3. [Data Models](#-data-models)
4. [Error Handling](#-error-handling)
5. [Testing Scenarios](#-testing-scenarios)

---

## 🔐 Authentication
All endpoints require JWT authentication (except where noted):
```bash
Authorization: Bearer <your_jwt_token>
```

---

## 🏠 Room Endpoints

### Get Public Rooms
**GET** `/api/rooms`

#### Request
```bash
curl -X GET http://localhost:5000/api/rooms \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Response (200)
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "room_abc123",
      "name": "General Chat",
      "description": "Public discussion room",
      "isPublic": true,
      "maxUsers": 50,
      "owner": {
        "id": "user_123",
        "name": "Admin",
        "avatar": "https://cdn.linkmeet.com/avatars/admin.jpg"
      },
      "memberCount": 27,
      "createdAt": "2023-08-15T10:30:00Z"
    }
  ]
}
```

---

### Create Room
**POST** `/api/rooms`

#### Request
```bash
curl -X POST http://localhost:5000/api/rooms \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dev Team Meeting",
    "description": "Daily standups",
    "isPublic": false,
    "password": "dev123",
    "maxUsers": 15
  }'
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "id": "room_xyz789",
    "name": "Dev Team Meeting",
    "description": "Daily standups",
    "isPublic": false,
    "maxUsers": 15,
    "ownerId": "user_123",
    "createdAt": "2023-08-15T11:45:00Z"
  }
}
```

---

### Get Room Details
**GET** `/api/rooms/:roomId`

#### Request
```bash
curl -X GET http://localhost:5000/api/rooms/room_abc123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "id": "room_abc123",
    "name": "General Chat",
    "description": "Public discussion room",
    "isPublic": true,
    "maxUsers": 50,
    "owner": {
      "id": "user_123",
      "name": "Admin"
    },
    "members": [
      {
        "userId": "user_123",
        "name": "Admin",
        "role": "OWNER",
        "joinedAt": "2023-08-15T10:30:00Z"
      }
    ],
    "createdAt": "2023-08-15T10:30:00Z"
  }
}
```

---

### Update Room
**PUT** `/api/rooms/:roomId`  
*(Owner only)*

#### Request
```bash
curl -X PUT http://localhost:5000/api/rooms/room_xyz789 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Daily dev standups and planning",
    "maxUsers": 20
  }'
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "id": "room_xyz789",
    "name": "Dev Team Meeting",
    "description": "Daily dev standups and planning",
    "maxUsers": 20,
    "updatedAt": "2023-08-15T12:00:00Z"
  }
}
```

---

### Delete Room
**DELETE** `/api/rooms/:roomId`  
*(Owner only)*

#### Request
```bash
curl -X DELETE http://localhost:5000/api/rooms/room_xyz789 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Response (200)
```json
{
  "success": true,
  "data": {}
}
```

---

## 👥 Member Endpoints

### Join Room
**POST** `/api/rooms/:roomId/join`

#### Request (Private Room)
```bash
curl -X POST http://localhost:5000/api/rooms/room_xyz789/join \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"password": "dev123"}'
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "roomId": "room_xyz789",
    "userId": "user_456",
    "role": "PARTICIPANT",
    "joinedAt": "2023-08-15T12:30:00Z"
  }
}
```

---

### Leave Room
**POST** `/api/rooms/:roomId/leave`

#### Request
```bash
curl -X POST http://localhost:5000/api/rooms/room_xyz789/leave \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Response (200)
```json
{
  "success": true,
  "data": {}
}
```

---

### Get Room Members
**GET** `/api/rooms/:roomId/members`

#### Request
```bash
curl -X GET http://localhost:5000/api/rooms/room_abc123/members \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Response (200)
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "userId": "user_123",
      "name": "Admin",
      "avatar": "https://cdn.linkmeet.com/avatars/admin.jpg",
      "role": "OWNER",
      "isOnline": true,
      "joinedAt": "2023-08-15T10:30:00Z"
    },
    {
      "userId": "user_456",
      "name": "Developer",
      "role": "MODERATOR",
      "isOnline": false,
      "joinedAt": "2023-08-15T11:00:00Z"
    }
  ]
}
```

---

### Update Member Role
**PUT** `/api/rooms/:roomId/members/:userId`  
*(Owner/Moderator only)*

#### Request
```bash
curl -X PUT http://localhost:5000/api/rooms/room_abc123/members/user_789 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"role": "MODERATOR"}'
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "userId": "user_789",
    "role": "MODERATOR",
    "updatedAt": "2023-08-15T13:00:00Z"
  }
}
```

---

### Remove Member
**DELETE** `/api/rooms/:roomId/members/:userId`  
*(Owner/Moderator only)*

#### Request
```bash
curl -X DELETE http://localhost:5000/api/rooms/room_abc123/members/user_789 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Response (200)
```json
{
  "success": true,
  "data": {}
}
```

---

## 📊 Data Models

### Room Object
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "isPublic": "boolean",
  "password": "string|null",
  "maxUsers": "number",
  "ownerId": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Member Object
```json
{
  "userId": "string",
  "roomId": "string",
  "role": "OWNER|MODERATOR|PARTICIPANT",
  "joinedAt": "ISO8601"
}
```

---

## ⚠️ Error Handling

### Common Errors
| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid request body |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Room/member not found |
| 409 | Conflict | Already a member |
| 429 | Too Many Requests | Rate limit exceeded |

#### Example Error Response
```json
{
  "success": false,
  "error": "Room not found",
  "code": "ROOM_NOT_FOUND",
  "details": {
    "roomId": "invalid_id"
  }
}
```