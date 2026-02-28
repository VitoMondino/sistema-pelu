FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.js"]
