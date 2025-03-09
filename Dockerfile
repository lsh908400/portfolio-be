FROM node:16-alpine

WORKDIR /app

# 종속성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY dist ./dist

# 앱 실행
EXPOSE 5000
CMD ["node", "dist/app.js"]