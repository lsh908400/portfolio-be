import mongoose from 'mongoose';
import config from './config';
import logger from '../utils/logger';

// MongoDB 연결 URI
const mongoURI = config.mongoURI;

// MongoDB 연결 옵션
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// MongoDB 연결 함수
export const connectMongo = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoURI);
    logger.info('MongoDB 연결 성공');
  } catch (error) {
    logger.error('MongoDB 연결 실패:', error);
    throw error;
  }
};

// MongoDB 연결 해제 함수 (필요시 사용)
export const disconnectMongo = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB 연결 해제');
  } catch (error) {
    logger.error('MongoDB 연결 해제 실패:', error);
    throw error;
  }
};

// MongoDB 연결 이벤트 리스너
mongoose.connection.on('connected', () => {
  logger.info(`MongoDB 연결됨: ${mongoURI}`);
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB 연결 오류: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.info('MongoDB 연결이 끊어짐');
});

// 애플리케이션 종료 시 연결 해제
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  logger.info('애플리케이션 종료로 MongoDB 연결 해제');
  process.exit(0);
});

export default mongoose;