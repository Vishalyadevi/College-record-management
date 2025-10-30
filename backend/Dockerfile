# Backend Dockerfile
FROM node:18

# Create working directory inside container
WORKDIR /app

# Copy package.json & package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of backend source code
COPY . .

# Expose backend port
EXPOSE 4000

# Start backend
CMD ["npm", "start"]
