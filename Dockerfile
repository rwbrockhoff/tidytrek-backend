# Use Node 22 LTS with latest Alpine
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
# All deps needed for building
RUN npm ci 
COPY . .

# Development stage
FROM base AS development
EXPOSE 4001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
# TypeScript → JavaScript compilation
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
# ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
EXPOSE 4001
CMD ["npm", "start"]