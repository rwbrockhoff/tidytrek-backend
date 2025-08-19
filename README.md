# TidyTrek Backend API

Node.js REST API for backpacking gear management with TypeScript, PostgreSQL, and AWS integration.

## Related Repositories

- **[Frontend](https://github.com/rwbrockhoff/tidytrek-frontend)** - React application
- **[Landing](https://github.com/rwbrockhoff/tt-landing)** - Marketing site

## Tech Stack

**Backend**: Node.js, TypeScript, Express, PostgreSQL  
**Database**: Knex.js query builder with migrations  
**Authentication**: Supabase with refresh token rotation  
**Infrastructure**: AWS S3 + CloudFront, Redis (ElastiCache), PM2 clustering  
**Testing**: Vitest + Supertest with isolated test database  
**Monitoring**: Winston logging, Sentry error tracking

## Key Features

### Production Architecture

- **PM2 clustering** with 2 instances for high availability
- **Redis-backed rate limiting** using AWS ElastiCache
- **Async photo processing** for instant uploads with background optimization
- **Type-safe database queries** with full TypeScript integration
- **Service layer architecture** for complex business logic

### Core Functionality

- **Fractional indexing** for efficient drag-and-drop reordering
- **Multi-bucket file uploads** with S3 and CloudFront CDN
- **Web scraping** for pack migration from other services
- **Secure authentication** with signed cookies and token rotation

### Performance Optimizations

- **Async image processing**: Users see photos instantly while optimization happens in background
- **Redis caching**: Distributed rate limiting and session management
- **CloudFront CDN**: Global edge caching for static assets
- **Database indexing**: Optimized queries with proper constraints

## Development

### Testing

- **Unit tests**: Controller logic and utility functions
- **Integration tests**: End-to-end API workflows
- **Database tests**: Migration and transaction testing
- **Separate test database**: Isolated test environment

## Production Deployment

### Infrastructure

- **Multi-VPC architecture** with VPC peering
- **EC2 instances** in private subnets with bastion host access
- **PostgreSQL RDS** in isolated database VPC
- **ElastiCache Redis** for distributed caching
- **S3 + CloudFront** for file storage and CDN

### CI/CD Pipeline

- **GitHub Actions** for automated testing and deployment
- **Direct EC2 deployment** via SSH and rsync
- **Security**: Temporary IP whitelisting during deployment
- **Cache invalidation**: Automatic CloudFront cache clearing

### Process Management

- **PM2 clustering**: Multiple Node.js instances with load balancing
- **Graceful restarts**: Zero-downtime deployments
- **Health monitoring**: Process and memory monitoring (via PM2+)

## Security

### Authentication

- Supabase-managed user registration and email verification
- Refresh token rotation with secure HTTP-only cookies
- Protected routes with middleware validation

### Data Protection

- Input validation and sanitization
- CORS with environment-specific origins
- Signed cookies for session management

---

**Author**: Ryan Brockhoff  
**Contact**: ryanbrockhoff@protonmail.com  
**Portfolio**: [ryanbrockhoff.com](https://ryanbrockhoff.com/)
