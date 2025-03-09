import { Sequelize, Options } from 'sequelize';
import config from './config';
import logger from '../utils/logger';

// MySQL 연결 옵션
const mysqlOptions: Options = {
  host: config.mysqlHost,
  port: config.mysqlPort,
  dialect: 'mysql',
  logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 5,
    min: 0, 
    acquire: 30000,
    idle: 10000
  },
  timezone: '+09:00' // 한국 시간대 (필요에 따라 조정)
};

// Sequelize 인스턴스 생성
export const sequelize = new Sequelize(
  config.mysqlDatabase,
  config.mysqlUser,
  config.mysqlPassword,
  mysqlOptions
);

// MySQL 연결 함수
export const connectMySQL = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL 연결 성공');
  } catch (error) {
    logger.error('MySQL 연결 실패:', error);
    throw error;
  }
};

// 데이터베이스 동기화 함수 (모델 -> 테이블)
export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force, alter: !force && config.env === 'development' });
    logger.info(`MySQL 데이터베이스 동기화 완료 (force: ${force})`);
  } catch (error) {
    logger.error('MySQL 데이터베이스 동기화 실패:', error);
    throw error;
  }
};

// MySQL 연결 해제 함수 (필요시 사용)
export const disconnectMySQL = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('MySQL 연결 해제');
  } catch (error) {
    logger.error('MySQL 연결 해제 실패:', error);
    throw error;
  }
};

// 애플리케이션 종료 시 연결 해제
process.on('SIGINT', async () => {
  await sequelize.close();
  logger.info('애플리케이션 종료로 MySQL 연결 해제');
  process.exit(0);
});

export default sequelize;