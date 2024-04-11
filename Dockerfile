FROM node:20
WORKDIR /app
COPY package*.json .
RUN npm ci
# COPY . . 
# RUN npm run build
EXPOSE 4001
CMD ["node", "server/index.js"]