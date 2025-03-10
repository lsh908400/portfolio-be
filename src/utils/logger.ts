import winston from 'winston';
import path from 'path';
import config from '../config/config';

// 로그 디렉토리
const logDir = 'logs';

// 로거 설정
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    // 콘솔 출력
    new (winston.transports.Console as any)({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
    }),
    // 파일 출력 (에러 레벨)
    new (winston.transports.File as any)({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // 파일 출력 (모든 레벨)
    new (winston.transports.File as any)({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

export default logger;