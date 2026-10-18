FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies (tsx is in dependencies for executing server.ts)
RUN npm install

# Copy source code
COPY . .

# Build frontend into dist directory
RUN npm run build

# Cloud Run container environment
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

# Start server using tsx
CMD ["npx", "tsx", "server.ts"]
