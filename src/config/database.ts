import { connectMongo } from './mongo';
import { connectMySQL } from './mysqldb';
import { connectRedis } from './redisdb';
import logger from '../utils/logger';

export const initializeDatabases = async (): Promise<void> => {
  try {
    await connectMySQL();
    await connectMongo();
    await connectRedis();
    
    logger.info('모든 데이터베이스 연결 성공');
  } catch (error) {
    logger.error('데이터베이스 연결 초기화 중 오류 발생:', error);
    process.exit(1);
  }
};

// 각 데이터베이스 클라이언트 내보내기
export * from './mongo';
export * from './mysqldb';
export * from './redisdb';