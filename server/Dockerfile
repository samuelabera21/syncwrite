FROM node:22-alpine

WORKDIR /app

# Install openssl (required by Prisma on alpine)
RUN apk add --no-cache openssl

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy Prisma schema and migrations, then generate the client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the backend source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the API and WebSocket port
EXPOSE 5000

# The startup command executes migrations before starting the compiled app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
