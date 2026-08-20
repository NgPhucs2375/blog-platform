FROM node:20.15-alpine

WORKDIR /app

# Tận dụng Docker layer caching khi cài dependencies
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]