import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // IP당 최대 요청 수
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: '너무 많은 요청이 발생했습니다. 15분 후에 다시 시도해주세요.',
    },
});

export const updateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1분
    max: 10, // IP당 최대 요청 수
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: '너무 많은 업데이트 요청이 발생했습니다. 1분 후에 다시 시도해주세요.',
    },
});