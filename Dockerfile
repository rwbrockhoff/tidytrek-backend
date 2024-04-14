# build
FROM node:20-alpine3.19 as base
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4001

# development
FROM node:20-alpine3.19 AS development
CMD ["node", "server/index.js"]

# production
FROM node:20-alpine3.19 AS production
WORKDIR /app
RUN chown -R node:node /app
USER node
COPY --from=base  --chown=node:node /app/dist .
RUN NODE_ENV=production npm install --omit-dev
CMD ["node", "server/index.js"]