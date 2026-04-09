FROM node:18-alpine

WORKDIR /app

# Install docker CLI so the gateway can query the host docker socket
RUN apk add --no-cache docker-cli

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source code
COPY . .

# Expose the API port
EXPOSE 3000

# Start the Gateway
CMD ["npm", "start"]
