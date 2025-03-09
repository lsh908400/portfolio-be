// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError, getErrorMessage } from '../constants/errorMessages';

// ErrorRequestHandler 타입을 사용하고 반환 타입을 void로 처리합니다
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err);
  
  // 커스텀 AppError 인스턴스인 경우
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      domain: err.domain,
      action: err.action
    });
    return;
  }
  
  // 일반 Error 인스턴스인 경우
  const error = err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다');
  
  res.status(500).json({
    success: false,
    error: error.message || getErrorMessage('general', 'read'),
    message: '서버에서 오류가 발생했습니다.'
  });
};
