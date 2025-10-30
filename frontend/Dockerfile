# ---------- Build Stage ----------
FROM node:18-bullseye AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Delete Windows-generated lock file to fix Rollup bug
RUN rm -f package-lock.json

# Clean install dependencies (Linux versions)
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build production files
RUN npm run build

# ---------- Production Stage ----------
FROM nginx:1.25-alpine

# Copy built Vite app
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
