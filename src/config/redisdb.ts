import { createClient, RedisClientType } from 'redis';
import config from './config';
import logger from '../utils/logger';

// Redis 클라이언트 옵션
const redisOptions = {
  url: `redis://${config.redisHost}:${config.redisPort}`,
  password: config.redisPassword || undefined
};

// Redis 클라이언트 생성
export const redisClient: RedisClientType = createClient(redisOptions);

// Redis 연결 이벤트 리스너
redisClient.on('error', (err) => {
  logger.error('Redis 클라이언트 오류:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis 연결 시도 중...');
});

redisClient.on('ready', () => {
  logger.info(`Redis 연결 성공: ${config.redisHost}:${config.redisPort}`);
});

redisClient.on('end', () => {
  logger.info('Redis 연결 종료');
});

// Redis 연결 함수
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis 연결 실패:', error);
    throw error;
  }
};

// Redis 연결 해제 함수
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.disconnect();
    logger.info('Redis 연결 해제');
  } catch (error) {
    logger.error('Redis 연결 해제 실패:', error);
    throw error;
  }
};

// 캐시 저장 헬퍼 함수
export const setCache = async (key: string, data: any, expireSeconds: number = 3600): Promise<void> => {
  try {
    await redisClient.setEx(key, expireSeconds, JSON.stringify(data));
  } catch (error) {
    logger.error(`Redis 캐시 설정 오류 (${key}):`, error);
    throw error;
  }
};

// 캐시 가져오기 헬퍼 함수
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) as T : null;
  } catch (error) {
    logger.error(`Redis 캐시 가져오기 오류 (${key}):`, error);
    throw error;
  }
};

// 캐시 삭제 헬퍼 함수
export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Redis 캐시 삭제 오류 (${key}):`, error);
    throw error; 
  }
};

// 애플리케이션 종료 시 연결 해제
process.on('SIGINT', async () => {
  await redisClient.disconnect();
  logger.info('애플리케이션 종료로 Redis 연결 해제');
  process.exit(0);
});

export default redisClient;