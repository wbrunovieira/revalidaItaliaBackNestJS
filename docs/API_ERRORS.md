# API Error Reference

## Error Response Format (RFC 7807)

All API errors follow the Problem Details standard:

```json
{
  "type": "https://api.revalidaitalia.com/errors/authentication-failed",
  "title": "Authentication Failed",
  "status": 401,
  "detail": "Invalid credentials",
  "instance": "/auth/login",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-20T15:30:00.000Z"
}
```

## Common Error Types

### Authentication Errors (4xx)

| Status | Type | When It Occurs |
|--------|------|----------------|
| 401 | authentication-failed | Invalid login credentials |
| 401 | token-expired | JWT token has expired |
| 401 | token-invalid | Malformed or tampered token |
| 403 | insufficient-permissions | User lacks required role |
| 429 | rate-limit-exceeded | Too many requests |

### Validation Errors (400)

| Type | Example Detail | Notes |
|------|----------------|-------|
| validation-failed | Email format is invalid | Generic message shown |
| missing-required-field | Field 'email' is required | |
| invalid-field-format | Invalid date format | |

### Business Logic Errors (422)

| Type | Example Detail |
|------|----------------|
| enrollment-exists | Already enrolled in this course |
| course-full | Course has reached maximum capacity |
| prerequisite-not-met | Must complete Course A first |

### Server Errors (5xx)

| Status | Type | Action Required |
|--------|------|-----------------|
| 500 | internal-server-error | Contact support with traceId |
| 502 | bad-gateway | Retry after a moment |
| 503 | service-unavailable | Check status page |

## Error Handling Best Practices

### Client-Side Implementation

```javascript
try {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    
    switch (error.status) {
      case 401:
        // Handle authentication failure
        showMessage('Invalid credentials. Please try again.');
        break;
      case 429:
        // Handle rate limiting
        const retryAfter = response.headers.get('Retry-After');
        showMessage(`Too many attempts. Try again in ${retryAfter} seconds.`);
        break;
      default:
        // Generic error handling
        showMessage('An error occurred. Please try again.');
        console.error('API Error:', error.traceId);
    }
    return;
  }

  const data = await response.json();
  // Success handling
} catch (error) {
  // Network or parsing error
  showMessage('Connection error. Please check your internet.');
}
```

### Important Security Notes

1. **Authentication errors always return generic messages** to prevent user enumeration
2. **Rate limiting** is applied per IP for unauthenticated endpoints
3. **Error details** in production never expose system internals
4. **TraceId** should be provided to support for debugging

## Support

When contacting support about an error:
1. Provide the `traceId` from the error response
2. Include the timestamp
3. Describe what action you were performing
4. Email: api@revalidaitalia.com