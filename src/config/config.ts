import dotenv from 'dotenv';
import DotenvFlow from 'dotenv-flow';

const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`[config] 현재 환경: ${nodeEnv}`);

// NODE_ENV에 따라 다른 환경 파일 로드
DotenvFlow.config({
  node_env: nodeEnv,
  default_node_env: 'development'
});

const config = {
   // 앱 설정
   env: nodeEnv || 'development',
   port: parseInt(process.env.PORT || '5000', 10),
   corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
   uploadPath: process.env.UPLOAD_PATH || 'uploads',
   
   // MongoDB 설정
   mongoURI: process.env.MONGO_URI || 'mongodb://portfolio:Alcls154-%2A@15.164.212.30:27017/portfolio?authSource=portfolio',
   
   // MySQL 설정
   mysqlHost: process.env.MYSQL_HOST || '15.164.212.30',
   mysqlPort: parseInt(process.env.MYSQL_PORT || '3306', 10),
   mysqlDatabase: process.env.MYSQL_DATABASE || 'portfolio',
   mysqlUser: process.env.MYSQL_USER || 'portfolio',
   mysqlPassword: process.env.MYSQL_PASSWORD || 'Alcls154-*',
   
   // Redis 설정
   redisHost: process.env.REDIS_HOST || '15.164.212.30',
   redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
   redisPassword: process.env.REDIS_PASSWORD || 'Alcls154-*',
   
   // 세션 설정
  //  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
};

export default config;