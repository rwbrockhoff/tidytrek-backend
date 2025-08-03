# 🥾 TidyTrek Backend API

## Overview

Node.js REST API for backpacking gear management with fractional indexing, web scraping, and AWS S3 integration. Features PostgreSQL database, JWT authentication, and comprehensive testing with production deployment on AWS.

**Live API**: [TidyTrek Backend](https://api.tidytrek.co/)

## Related Repos
- **[Frontend](https://github.com/rwbrockhoff/tidytrek-frontend)** - React app
- **[Landing](https://github.com/rwbrockhoff/tt-landing)** - Marketing site

## Tech Stack

**Core**: Node.js 22, TypeScript (strict), Express, PostgreSQL  
**Database**: Knex.js migrations, Supabase auth  
**Infrastructure**: AWS S3 + CloudFront, Docker, Sentry monitoring  
**Testing**: Vitest + Supertest with separate test DB

## Key Features

### Architecture

- Database migrations and seeding with Knex.js
- TypeScript throughout with strict configuration
- Testing with Vitest and Supertest
- Docker containerization for dev/production
- AWS S3 integration for file uploads with CloudFront CDN

### Tech Stack

**Core**

- Node.js with Express
- PostgreSQL with Knex.js query builder
- Supabase for authentication and user management
- Winston for structured logging

**Security & Middleware**

- CORS with environment-specific origins
- Rate limiting with express-rate-limit
- JWT authentication with signed cookies
- Input validation and sanitization

**Infrastructure**

- AWS S3 for file storage with CloudFront CDN
- Docker multi-stage builds for dev/production
- Sentry for error tracking and monitoring

**Testing**

- Vitest for unit and integration testing
- Comprehensive test coverage
- Separate test database configuration

## Features

### Fractional Indexing

Fractional indexing for efficient drag-and-drop reordering without bulk updates.

```typescript
// Efficient reordering with fractional indexing
const newIndex = moveWithFractionalIndex(currentIndex, targetIndex, siblingIndexes);
```

### File Upload System

AWS S3 integration with automatic image resizing, CloudFront CDN distribution, and signed URLs.

```typescript
// Multi-bucket upload configuration
const buckets = {
	profilePhotoBucket: { width: 200 },
	bannerPhotoBucket: { width: 1600, height: 400 },
	packPhotoBucket: { width: 600, height: 400 },
};
```

### Web Scraping

Automated pack data extraction using Puppeteer. Users can easily migrate
existing packs from Lighterpack (an older app not being updated anymore).
This makes the switch easy and improves user adoption.

```typescript
// Pack data scraping from external sources
const packData = await packScraper(url);
```

## Security Implementation

### Authentication Flow

1. Supabase handles user registration and email verification
2. JWT tokens issued with secure, signed cookies
3. Refresh token rotation for enhanced security
4. Protected routes with middleware validation

## Testing Strategy

### Test Structure

**Unit Tests**

- Controller logic testing
- Utility function validation
- Database query testing
- Authentication middleware testing

**Integration Tests**

- End-to-end API workflow testing
- Database transaction testing
- Error handling validation

**E2E Tests**

Backend includes test endpoints for frontend E2E testing. These endpoints
allow the frontend tests to reset and manage the test database.

### Database Testing

Separate test database with automatic setup/teardown:

```bash
# Test database lifecycle
npm run test:db-reset    # Clean slate
npm run test:migrate     # Apply migrations
npm run test:seed        # Add test data
npm run test             # Run tests
```

## Monitoring

### Logging

Winston structured logging with different levels:

```typescript
// Structured logging
logger.info('User registration successful', {
	userId: user_id,
	email,
	hasRefreshToken: !!supabase_refresh_token,
});
// I also have a Sentry wrapped logger for errors
```

### Error Tracking

Sentry integration for production error monitoring and performance tracking.

## CI/CD & Deployment

### GitHub Actions Pipeline

**Test Pipeline**

- Automated testing on pull requests
- Database setup and migration testing
- Code coverage reporting

**Deployment Pipeline**

- GitHub Actions with temporary IP whitelisting
- Direct deployment to EC2 via SSH and rsync
- CloudFront cache invalidation

### Production Infrastructure

**Current Setup**

- Multi-VPC architecture with VPC peering
- EC2 instances in private subnets
- PostgreSQL RDS in isolated VPC
- S3 + CloudFront for static assets
- Bastion host for secure access

---

**Author**: Ryan Brockhoff  
**Email**: ryanbrockhoff@protonmail.com  
**Website**: [Developer Website](https://ryanbrockhoff.com/)
