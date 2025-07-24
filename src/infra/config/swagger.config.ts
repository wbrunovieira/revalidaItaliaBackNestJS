// src/infra/config/swagger.config.ts
import { DocumentBuilder } from '@nestjs/swagger';

/**
 * Creates Swagger configuration for API documentation
 */
export function createSwaggerConfig() {
  const authRateLimit = process.env.RATE_LIMIT_AUTH_MAX || '5';
  const authWindow = process.env.RATE_LIMIT_AUTH_WINDOW || '60';
  const apiRateLimit = process.env.RATE_LIMIT_API_MAX || '100';
  const apiWindow = process.env.RATE_LIMIT_API_WINDOW || '60';

  const config = new DocumentBuilder()
    .setTitle('Revalida Italia API')
    .setDescription(
      `
      RESTful API for the Italian medical diploma revalidation system.
      
      ## Overview
      This API provides endpoints for managing the revalidation process of medical diplomas in Italy,
      including user authentication, course management, video lessons, and progress tracking.
      
      ## Authentication
      Most endpoints require authentication via JWT Bearer token.
      1. Obtain token via POST /auth/login
      2. Include token in Authorization header: "Bearer {token}"
      3. Tokens expire after 24 hours
      
      ## Rate Limiting
      - Authentication endpoints: ${authRateLimit} requests per ${authWindow} seconds per IP
      - Other endpoints: ${apiRateLimit} requests per ${apiWindow} seconds per token
      
      ## User Roles
      - **student**: Can access courses, watch videos, track progress
      - **instructor**: Can manage courses and content
      - **admin**: Full system access
      
      ## Error Handling
      All errors follow RFC 7807 (Problem Details for HTTP APIs)
    `,
    )
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token obtained from /auth/login',
    })
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User profile management')
    .addTag('Courses', 'Course catalog and enrollment')
    .addTag('Videos', 'Video content and progress tracking')
    .setContact(
      'API Support',
      'https://portalrevalida.com/support',
      'api@portalrevalida.com',
    )
    .setLicense('Proprietary', 'https://portalrevalida.com/terms')
    .build();

  // Add servers from environment
  const swaggerServers = process.env.SWAGGER_SERVERS?.split(',') || [
    'http://localhost:3333',
    'https://api.portalrevalida.com',
  ];

  swaggerServers.forEach((server, index) => {
    const serverName = index === 0 ? 'Local Development' : 'Production';
    config.servers = config.servers || [];
    config.servers.push({ url: server.trim(), description: serverName });
  });

  return config;
}
