FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm install tsx
COPY . .
RUN npm run build:client || npm run build || vite build
EXPOSE 5000
CMD ["npx", "tsx", "server/index.ts"]
