
###Testing Documentation

```markdown
## User Management Endpoints

### 1. Get All Users (Admin Only)

**Endpoint**: `GET /api/users`  
**Description**: Get list of all users (admin only)  
**Authentication**: Required (Admin JWT token)  

#### Request:
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Successful Response (200 OK):
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "clxyz...",
      "email": "admin@example.com",
      "name": "Admin User",
      "avatar": null,
      "isOnline": true,
      "role": "ADMIN",
      "createdAt": "2023-08-10T12:34:56.789Z"
    },
    ...
  ]
}
```

#### Error Cases:
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Non-admin user

---

### 2. Get User by ID

**Endpoint**: `GET /api/users/:id`  
**Description**: Get user details by ID  
**Authentication**: Required (JWT token)  

#### Request:
```bash
curl -X GET http://localhost:5000/api/users/clxyz... \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Successful Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "email": "test@example.com",
    "name": "Test User",
    "avatar": null,
    "isOnline": true,
    "createdAt": "2023-08-10T12:34:56.789Z"
  }
}
```

#### Error Cases:
- **401 Unauthorized** - Missing or invalid token
- **404 Not Found** - User not found

---

### 3. Update User Online Status

**Endpoint**: `PUT /api/users/:id/status`  
**Description**: Update user's online status  
**Authentication**: Required (JWT token)  

#### Request:
```bash
curl -X PUT http://localhost:5000/api/users/clxyz.../status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"isOnline": false}'
```

#### Successful Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "email": "test@example.com",
    "name": "Test User",
    "isOnline": false
  }
}
```

#### Error Cases:
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Updating another user as non-admin
- **400 Bad Request** - Invalid status value

---

