# API Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Obtain Access Token

```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.student@example.com",
    "password": "TestPassword123"
  }'
```

**Response:**
```json
{
  "auth": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "expiresAt": "2024-01-21T15:30:00.000Z"
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test.student@example.com",
    "role": "student",
    "firstName": "Test",
    "lastName": "Student"
  }
}
```

### 2. Use Token in Requests

```bash
curl -X GET http://localhost:3333/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📊 Common Workflows

### Student Workflow
1. **Login** → `/auth/login`
2. **Get Profile** → `/users/profile`
3. **List Courses** → `/courses`
4. **Enroll** → `/enrollments`
5. **Watch Videos** → `/videos/{id}`
6. **Track Progress** → `/progress`

### Admin Workflow
1. **Login** → `/auth/login`
2. **List Users** → `/users`
3. **Manage Courses** → `/courses` (CRUD)
4. **View Analytics** → `/analytics`

## 🔒 Security Best Practices

1. **Store tokens securely** - Never in localStorage
2. **Use HTTPS** in production
3. **Implement token refresh** before expiration
4. **Handle 401 errors** gracefully

## 🐛 Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token expired or invalid | Re-authenticate |
| 403 Forbidden | Insufficient permissions | Check user role |
| 429 Too Many Requests | Rate limit exceeded | Wait and retry |

## 📚 Resources

- [Full API Documentation](/api/docs)
- [Postman Collection](https://postman.com/revalidaitalia)
- [SDK Libraries](https://github.com/revalidaitalia/sdk)
- [Support](mailto:api@revalidaitalia.com)