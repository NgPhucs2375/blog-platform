FROM node:20.15-alpine

WORKDIR /app

# Cài đặt thư viện phụ thuộc
COPY package.json package-lock.json* ./
RUN npm install

# Copy mã nguồn
COPY . .

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]