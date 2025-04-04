// src/constants/errorMessages.ts

// 에러 메시지 타입 정의
export type ErrorDomain = 'user' | 'code' | 'introduction' | 'general' | 'board' | 'category' | 'block' | 'folder' | 'tree' | 'purpose' | 'project' | 'snippet' | 'timeline';
export type ErrorAction = 'create' | 'read' | 'update' | 'delete' | 'find' | 'validate';

// 에러 메시지 인터페이스
interface ErrorMessages {
  [domain: string]: {
    [action: string]: string;
    notFound: string;
    alreadyExists: string;
    invalidData: string;
    unauthorized: string;
  };
}

// 각 도메인별 에러 메시지 정의
const errorMessages: ErrorMessages = {
  user: {
    create: '사용자 생성에 실패했습니다.',
    read: '사용자 정보를 불러오는데 실패했습니다.',
    update: '사용자 정보 업데이트에 실패했습니다.',
    delete: '사용자 삭제에 실패했습니다.',
    find: '사용자를 찾는데 실패했습니다.',
    validate: '사용자 데이터 검증에 실패했습니다.',
    notFound: '사용자를 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 사용자입니다.',
    invalidData: '유효하지 않은 사용자 데이터입니다.',
    unauthorized: '사용자 접근 권한이 없습니다.'
  },
  code: {
    create: '코드 생성에 실패했습니다.',
    read: '코드를 불러오는데 실패했습니다.',
    update: '코드 업데이트에 실패했습니다.',
    delete: '코드 삭제에 실패했습니다.',
    find: '코드를 찾는데 실패했습니다.',
    validate: '코드 데이터 검증에 실패했습니다.',
    notFound: '코드를 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 코드입니다.',
    invalidData: '유효하지 않은 코드 데이터입니다.',
    unauthorized: '코드 접근 권한이 없습니다.'
  },
  introduction: {
    create: '자기소개서 생성에 실패했습니다.',
    read: '자기소개서를 불러오는데 실패했습니다.',
    update: '자기소개서 업데이트에 실패했습니다.',
    delete: '자기소개서 삭제에 실패했습니다.',
    find: '자기소개서를 찾는데 실패했습니다.',
    validate: '자기소개서 데이터 검증에 실패했습니다.',
    notFound: '자기소개서를 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 자기소개서입니다.',
    invalidData: '유효하지 않은 자기소개서 데이터입니다.',
    unauthorized: '자기소개서 접근 권한이 없습니다.'
  },
  board:{
    create:        '게시판 생성에 실패했습니다.',
    read:          '게시판을 불러오는데 실패했습니다.',
    update:        '게시판 업데이트에 실패했습니다.',
    delete:        '게시판 삭제에 실패했습니다.',
    find:          '게시판을 찾는데 실패했습니다.',
    validate:      '게시판 데이터 검증에 실패했습니다.',
    notFound:      '게시판을 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 게시판입니다.',
    invalidData:   '유효하지 않은 게시판 데이터입니다.',
    unauthorized:  '게시판 접근 권한이 없습니다.'
  },
  general: {
    create: '리소스 생성에 실패했습니다.',
    read: '리소스를 불러오는데 실패했습니다.',
    update: '리소스 업데이트에 실패했습니다.',
    delete: '리소스 삭제에 실패했습니다.',
    find: '리소스를 찾는데 실패했습니다.',
    validate: '데이터 검증에 실패했습니다.',
    notFound: '리소스를 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 리소스입니다.',
    invalidData: '유효하지 않은 데이터입니다.',
    unauthorized: '접근 권한이 없습니다.'
  },
  category : {
    create:        '카테고리 생성에 실패했습니다.',
    read:          '카테고리를 불러오는데 실패했습니다.',
    update:        '카테고리 업데이트에 실패했습니다.',
    delete:        '카테고리 삭제에 실패했습니다.',
    find:          '카테고리를 찾는데 실패했습니다.',
    validate:      '카테고리 데이터 검증에 실패했습니다.',
    notFound:      '카테고리를 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 카테고리입니다.',
    invalidData:   '유효하지 않은 카테고리 데이터입니다.',
    unauthorized:  '카테고리 접근 권한이 없습니다.'
  },
  block : {
    create:        '블록 생성에 실패했습니다.',
    read:          '블록을 불러오는데 실패했습니다.',
    update:        '블록 업데이트에 실패했습니다.',
    delete:        '블록 삭제에 실패했습니다.',
    find:          '블록을 찾는데 실패했습니다.',
    validate:      '블록 데이터 검증에 실패했습니다.',
    notFound:      '블록을 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 블록입니다.',
    invalidData:   '유효하지 않은 블록 데이터입니다.',
    unauthorized:  '블록 접근 권한이 없습니다.'
  },
  folder : {
    create:        '폴더 생성에 실패했습니다.',
    read:          '폴더를 불러오는데 실패했습니다.',
    update:        '폴더 업데이트에 실패했습니다.',
    delete:        '폴더 삭제에 실패했습니다.',
    find:          '폴더를 찾는데 실패했습니다.',
    validate:      '폴더 데이터 검증에 실패했습니다.',
    notFound:      '폴더를 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 폴더입니다.',
    invalidData:   '유효하지 않은 폴더 데이터입니다.',
    unauthorized:  '폴더 접근 권한이 없습니다.'
  },
  tree : {
    create:        '트리 생성에 실패했습니다.',
    read:          '트리를 불러오는데 실패했습니다.',
    update:        '트리 업데이트에 실패했습니다.',
    delete:        '트리 삭제에 실패했습니다.',
    find:          '트리를 찾는데 실패했습니다.',
    validate:      '트리 데이터 검증에 실패했습니다.',
    notFound:      '트리를 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 트리입니다.',
    invalidData:   '유효하지 않은 트리 데이터입니다.',
    unauthorized:  '트리 접근 권한이 없습니다.'
  },
  purpose : {
    create:        '목적 생성에 실패했습니다.',
    read:          '목적을 불러오는데 실패했습니다.',
    update:        '목적 업데이트에 실패했습니다.',
    delete:        '목적 삭제에 실패했습니다.',
    find:          '목적을 찾는데 실패했습니다.',
    validate:      '목적 데이터 검증에 실패했습니다.',
    notFound:      '목적을 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 목적입니다.',
    invalidData:   '유효하지 않은 목적 데이터입니다.',
    unauthorized:  '목적 접근 권한이 없습니다.'
  },
  project : {
    create:        '프로젝트 생성에 실패했습니다.',
    read:          '프로젝트를 불러오는데 실패했습니다.',
    update:        '프로젝트 업데이트에 실패했습니다.',
    delete:        '프로젝트 삭제에 실패했습니다.',
    find:          '프로젝트를 찾는데 실패했습니다.',
    validate:      '프로젝트 데이터 검증에 실패했습니다.',
    notFound:      '프로젝트를 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 프로젝트입니다.',
    invalidData:   '유효하지 않은 프로젝트 데이터입니다.',
    unauthorized:  '프로젝트 접근 권한이 없습니다.'
  },
  snippet : {
    create:        '스니펫 생성에 실패했습니다.',
    read:          '스니펫을 불러오는데 실패했습니다.',
    update:        '스니펫 업데이트에 실패했습니다.',
    delete:        '스니펫 삭제에 실패했습니다.',
    find:          '스니펫을 찾는데 실패했습니다.',
    validate:      '스니펫 데이터 검증에 실패했습니다.',
    notFound:      '스니펫을 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 스니펫입니다.',
    invalidData:   '유효하지 않은 스니펫 데이터입니다.',
    unauthorized:  '스니펫 접근 권한이 없습니다.'
  },
  timeline : {
    create:        '타임라인 생성에 실패했습니다.',
    read:          '타임라인을 불러오는데 실패했습니다.',
    update:        '타임라인 업데이트에 실패했습니다.',
    delete:        '타임라인 삭제에 실패했습니다.',
    find:          '타임라인을 찾는데 실패했습니다.',
    validate:      '타임라인 데이터 검증에 실패했습니다.',
    notFound:      '타임라인을 찾을 수 없습니다.',
    alreadyExists: '이미 존재하는 타임라인입니다.',
    invalidData:   '유효하지 않은 타임라인 데이터입니다.',
    unauthorized:  '타임라인 접근 권한이 없습니다.'
  }
};

/**
 * 도메인과 액션에 맞는 에러 메시지를 반환하는 함수
 * @param domain 에러가 발생한 도메인 (user, code, introduction 등)
 * @param action 에러가 발생한 액션 (create, read, update 등)
 * @param customMessage 추가 메시지 (선택 사항)
 * @returns 에러 메시지
 */
export const getErrorMessage = (
  domain: ErrorDomain = 'general',
  action: ErrorAction | string = 'read',
  customMessage?: string
): string => {
  // 도메인이 정의되지 않은 경우 general 사용
  const domainMessages = errorMessages[domain] || errorMessages.general;
  
  // 액션이 정의되지 않은 경우 기본 메시지 사용
  const message = domainMessages[action] || domainMessages.read;
  
  // 추가 메시지가 있는 경우 결합
  return customMessage ? `${message} ${customMessage}` : message;
};

/**
 * 사용자 정의 에러 클래스
 */
export class AppError extends Error {
  public statusCode: number;
  public domain: ErrorDomain;
  public action: string;

  constructor(
    domain: ErrorDomain = 'general',
    action: ErrorAction | string = 'read',
    statusCode: number = 500,
    customMessage?: string
  ) {
    const message = getErrorMessage(domain, action, customMessage);
    super(message);
    
    this.statusCode = statusCode;
    this.domain = domain;
    this.action = action;
    this.name = 'AppError';
    
    // Error 클래스를 확장할 때 필요
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 특정 HTTP 상태 코드에 대한 에러 생성 함수
export const createNotFoundError = (domain: ErrorDomain, customMessage?: string) => {
  return new AppError(domain, 'notFound', 404, customMessage);
};

export const updateError = (domain: ErrorDomain, customMessage?:string) => {
  return new AppError(domain, 'update', 404, customMessage);
}

export const createBadRequestError = (domain: ErrorDomain, customMessage?: string) => {
  return new AppError(domain, 'invalidData', 400, customMessage);
};

export const createUnauthorizedError = (domain: ErrorDomain, customMessage?: string) => {
  return new AppError(domain, 'unauthorized', 401, customMessage);
};

export const createConflictError = (domain: ErrorDomain, customMessage?: string) => {
  return new AppError(domain, 'alreadyExists', 409, customMessage);
};

export const createServerError = (domain: ErrorDomain, customMessage?: string) => {
  return new AppError(domain, 'server error', 500, customMessage);
}

export const createPayloadTooLargeError = (domain : ErrorDomain, customMessage? : string) => {
  return new AppError(domain, 'payload too large', 413, customMessage)
}

export default {
  getErrorMessage,
  AppError,
  createNotFoundError,
  createBadRequestError,
  createUnauthorizedError,
  createConflictError
};