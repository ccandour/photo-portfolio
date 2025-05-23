FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built assets from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
COPY --from=build /app/static ./static

# Ensure the photos directory exists
RUN mkdir -p ./static/photos

# Install only production dependencies
RUN npm install --omit=dev

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "build"]
