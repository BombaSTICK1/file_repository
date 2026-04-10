FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY frontend/package*.json .
RUN npm ci

# Copy source code
COPY frontend .

# Expose port
EXPOSE 5173

# Run development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
