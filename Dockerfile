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
RUN npm run build

# Production stage
# Github Actions currently manages app deployment
# todo: migrate to AWS ECS for scaling in the future
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
# ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
EXPOSE 4001
CMD ["npm", "start"]