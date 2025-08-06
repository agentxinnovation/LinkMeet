Here's a comprehensive `TESTING.md` documentation file for your testing team with curl commands for all authentication endpoints:

```markdown
# LinkMeet API Testing Documentation

## Authentication Endpoints

### 1. Register a New User

**Endpoint**: `POST /api/auth/register`  
**Description**: Create a new user account  
**Authentication**: Not required  

#### Request:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

#### Successful Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "email": "testuser@example.com",
    "name": "Test User",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc1MjNkMGY4LTZkNjYtNGRkNS1hZTc4LTQxYTEwYjQwYmQ1ZiIsImlhdCI6MTc1NDQ5ODYxOSwiZXhwIjoxNzU1MTAzNDE5fQ.kRAR4v4P1IWTRhRy3Wqpyl4s1pgRlM1HvS_mrlwmLyY"
  }
}
```

#### Error Cases:
- **400 Bad Request** - Missing required fields
- **409 Conflict** - Email already exists

---

### 2. User Login

**Endpoint**: `POST /api/auth/login`  
**Description**: Authenticate and get JWT token  
**Authentication**: Not required  

#### Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "testpassword123"
  }'
```

#### Successful Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "email": "testuser@example.com",
    "name": "Test User",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc1MjNkMGY4LTZkNjYtNGRkNS1hZTc4LTQxYTEwYjQwYmQ1ZiIsImlhdCI6MTc1NDQ5ODYxOSwiZXhwIjoxNzU1MTAzNDE5fQ.kRAR4v4P1IWTRhRy3Wqpyl4s1pgRlM1HvS_mrlwmLyY"
  }
}
```

#### Error Cases:
- **400 Bad Request** - Missing credentials
- **401 Unauthorized** - Invalid credentials

---

### 3. Get Current User Profile

**Endpoint**: `GET /api/auth/me`  
**Description**: Get authenticated user's profile  
**Authentication**: Required (JWT token)  

#### Request:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc1MjNkMGY4LTZkNjYtNGRkNS1hZTc4LTQxYTEwYjQwYmQ1ZiIsImlhdCI6MTc1NDQ5ODYxOSwiZXhwIjoxNzU1MTAzNDE5fQ.kRAR4v4P1IWTRhRy3Wqpyl4s1pgRlM1HvS_mrlwmLyY"
```

#### Successful Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "email": "testuser@example.com",
    "name": "Test User",
    "avatar": null,
    "isOnline": true,
    "createdAt": "2023-08-10T12:34:56.789Z"
  }
}
```

#### Error Cases:
- **401 Unauthorized** - Missing or invalid token

---

### 4. Update User Profile

**Endpoint**: `PUT /api/auth/profile`  
**Description**: Update authenticated user's profile  
**Authentication**: Required (JWT token)  

#### Request:
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc1MjNkMGY4LTZkNjYtNGRkNS1hZTc4LTQxYTEwYjQwYmQ1ZiIsImlhdCI6MTc1NDQ5ODYxOSwiZXhwIjoxNzU1MTAzNDE5fQ.kRAR4v4P1IWTRhRy3Wqpyl4s1pgRlM1HvS_mrlwmLyY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

#### Successful Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clxyz...",
    "email": "testuser@example.com",
    "name": "Updated Name",
    "avatar": "https://example.com/avatar.jpg",
    "isOnline": true
  }
}
```

#### Error Cases:
- **401 Unauthorized** - Missing or invalid token
- **400 Bad Request** - Invalid data

---

### 5. User Logout

**Endpoint**: `POST /api/auth/logout`  
**Description**: Invalidate current session  
**Authentication**: Required (JWT token)  

#### Request:
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc1MjNkMGY4LTZkNjYtNGRkNS1hZTc4LTQxYTEwYjQwYmQ1ZiIsImlhdCI6MTc1NDQ5ODYxOSwiZXhwIjoxNzU1MTAzNDE5fQ.kRAR4v4P1IWTRhRy3Wqpyl4s1pgRlM1HvS_mrlwmLyY"
```

#### Successful Response (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Error Cases:
- **401 Unauthorized** - Missing or invalid token

---

## Test Scenarios

### Happy Path Flow
1. Register a new user
2. Login with the new credentials
3. Get profile with the received token
4. Update profile information
5. Logout

### Error Testing
1. Register with missing fields
2. Register with duplicate email
3. Login with invalid credentials
4. Access protected routes without token
5. Access protected routes with expired/invalid token

---

## Environment Setup
1. Ensure server is running on `http://localhost:5000`
2. Verify these environment variables are set:
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
3. Database should be properly migrated

---

## Rate Limiting
Authentication endpoints are rate limited:
- 5 requests per minute for `/register` and `/login`
- 100 requests per minute for other endpoints

---

*Last Updated: August 2023*  
*API Version: 1.0.0*
```

This documentation provides:
1. Clear endpoint descriptions
2. Ready-to-use curl commands
3. Example responses
4. Error cases
5. Test scenarios
6. Environment requirements

The testing team can:
- Copy-paste the curl commands directly
- See exactly what to expect in responses
- Understand all error cases
- Follow the suggested test flows
- Verify their environment setup

You can save this as `TESTING.md` in your project root directory.