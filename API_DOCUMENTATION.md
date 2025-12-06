# API Documentation Summary

## Swagger/OpenAPI Documentation

**Swagger UI (Interactive):** http://localhost:8000/api/docs/  
**ReDoc (Clean):** http://localhost:8000/api/redoc/  
**OpenAPI Schema (JSON):** http://localhost:8000/api/schema/

## Available Endpoints

### Authentication Endpoints

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/v1/auth/register/` | POST | Register new user | `{"email": "user@example.com", "password": "Pass123!", "password2": "Pass123!"}` |
| `/api/v1/auth/verify-email/` | POST | Verify email with OTP | `{"email": "user@example.com", "otp": "123456"}` |
| `/api/v1/auth/resend-otp/` | POST | Resend OTP code | `{"email": "user@example.com"}` |
| `/api/v1/auth/login/` | POST | Login user | `{"email": "user@example.com", "password": "Pass123!"}` |
| `/api/v1/auth/logout/` | POST | Logout user | `{"refresh": "refresh_token_here"}` |
| `/api/v1/auth/token/refresh/` | POST | Refresh access token | `{"refresh": "refresh_token_here"}` |
| `/api/v1/auth/token/verify/` | POST | Verify token | `{"token": "access_token_here"}` |
| `/api/v1/auth/me/` | GET | Get current user | *Requires Authentication* |
| `/api/v1/auth/check-email/` | GET | Check email status | Query: `?email=user@example.com` |
| `/api/v1/auth/debug/get-otp/` | GET | Get OTP (DEBUG) | Query: `?email=user@example.com` |

## Quick Test Flow

### 1. Register a New User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 2. Get OTP (Development Only)
```bash
curl "http://localhost:8000/api/v1/auth/debug/get-otp/?email=test@example.com"
```

### 3. Verify Email
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "YOUR_OTP_HERE"
  }'
```

### 4. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 5. Access Protected Endpoint
```bash
curl http://localhost:8000/api/v1/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Response Format

All endpoints return responses in this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "errors": [],
  "meta": {
    "timestamp": "2025-12-06T15:00:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "errors": [
    {"field": "email", "message": "This field is required"}
  ],
  "meta": {
    "timestamp": "2025-12-06T15:00:00Z"
  }
}
```

## Features

- ✅ JWT Authentication
- ✅ Email Verification with OTP
- ✅ Rate Limiting
- ✅ Audit Logging
- ✅ Redis Caching
- ✅ Comprehensive Error Handling
- ✅ Swagger/OpenAPI Documentation

## Testing in Swagger UI

1. Open http://localhost:8000/api/docs/
2. Find the endpoint you want to test
3. Click "Try it out"
4. Fill in the request body (examples provided)
5. Click "Execute"
6. See the response

All endpoints are documented and testable!
