FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Define Node environment
ENV NODE_ENV=production

# Copy built assets from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
COPY --from=build /app/static ./static

# Install production dependencies and create required directories in one layer
RUN npm ci --omit=dev && \
    mkdir -p ./static/photos ./data && \
    chown -R node:node /app

# Switch to the less privileged 'node' user for security
USER node

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "build"]
