import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { CodeMap } from '../types/code';
import * as crypto from 'crypto';
import { FolderConfig } from '../types/folder';

const publicDir = path.join(__dirname, '../../public');
const codeMapPath = path.join(publicDir, 'code-map.json');

// 코드 맵 파일 읽기
export const readCodeMap = (): CodeMap => {
    try 
    {
        // public 디렉토리가 없으면 생성
        if (!fs.existsSync(publicDir)) 
        {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // 파일이 없으면 빈 객체로 초기화
        if (!fs.existsSync(codeMapPath)) 
        {
            fs.writeFileSync(codeMapPath, JSON.stringify({}, null, 2), 'utf8');
            return {};
        }

        const data = fs.readFileSync(codeMapPath, 'utf8');
        return JSON.parse(data) as CodeMap;
    } 
    catch (error) 
    {
        console.error('코드 맵 읽기 오류:', error);
        return {};
    }
};

const ensureUploadDirExists = async (): Promise<void> => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fsPromises.access(uploadDir);
    } catch (error) {
      // 디렉토리가 없으면 생성
      await fsPromises.mkdir(uploadDir, { recursive: true });
    }
};

// base64 이미지를 파일로 저장하는 함수
export const saveBase64AsFile = async (base64Data: string, parentId: string): Promise<string> => {
    // 업로드 디렉토리 확인
    await ensureUploadDirExists();
    
    // base64 형식 검증
    if (!base64Data.startsWith('data:image/')) {
      throw new Error('유효하지 않은 이미지 형식입니다.');
    }
    
    // base64 데이터에서 형식과 실제 데이터 분리
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('유효하지 않은 base64 형식입니다.');
    }
    
    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // 파일 확장자 결정
    const extension = type.split('/')[1];
    const fileName = `${Date.now()}-${parentId}.${extension}`;
    let uploadDir;

    if (process.env.NODE_ENV === 'production') {
      // 프로덕션 환경에서의 경로
      uploadDir = process.env.UPLOAD_PATH || '/var/www/uploads';
    } else {
      // 개발 환경에서의 경로 (기본값)
      uploadDir = path.join(__dirname, '../uploads');
    }
    
    const filePath = path.join(uploadDir, fileName);
    // 파일 저장
    await fsPromises.writeFile(filePath, buffer);
    
    // 저장된 파일의 URL 반환
    return `/uploads/${fileName}`;
};

// 이미지 블록을 처리하는 함수
export const processImageBlocks = async (blocks: any[], parentId: string): Promise<any[]> => {
    return Promise.all(blocks.map(async (block) => {
      if (block.type === 'img' && block.data && block.data.url) {
        try {
          console.log(`이미지 블록 처리 시작: ${block.id}`);
          // 이미지 URL을 저장하고 새 URL로 교체
          const imageUrl = await saveBase64AsFile(block.data.url, parentId);
          
          // 원본 블록의 복사본을 만들어 URL 업데이트
          const updatedBlock = {
            ...block,
            data: {
              ...block.data,
              url: imageUrl  // base64 데이터를 저장된 이미지 경로로 교체
            }
          };
          
          console.log(`이미지 블록 처리 완료: ${block.id}, 저장된 URL: ${imageUrl}`);
          return updatedBlock;
        } catch (error) {
          console.error('이미지 처리 중 오류:', error);
          return block; // 오류 발생 시 원본 블록 반환
        }
      }
      
      // 이미지가 아닌 블록은 그대로 반환
      return block;
    }));
};

// 이미지 파일 삭제 함수 (필요 시)
export const deleteImageFile = async (imagePath: string): Promise<void> => {
    if (!imagePath.startsWith('/uploads/')) {
      return; // 업로드 폴더의 파일만 삭제 처리
    }
    
    const fileName = imagePath.replace('/uploads/', '');
  
    // 환경에 따른 업로드 디렉토리 설정
    let uploadDir;
    if (process.env.NODE_ENV === 'production') {
      uploadDir = process.env.UPLOAD_PATH || '/var/www/uploads';
    } else {
      uploadDir = path.join(__dirname, '../uploads');
    }
    
    // 파일 전체 경로 구성
    const filePath = path.join(uploadDir, fileName);
    
    try {
      await fsPromises.access(filePath);
      await fsPromises.unlink(filePath);
      console.log(`이미지 파일 삭제 완료: ${imagePath}`);
    } catch (error) {
      console.error(`이미지 파일 삭제 실패: ${imagePath}`, error);
    }
};


export const getUserDirectoryPath = (
  userId: string, 
  options?: { 
    password?: string;
    maxSizeBytes?: number;
  }
): { folderPath: string; config: FolderConfig} => {
  let userPath = '';
  if (process.env.NODE_ENV === 'production') {
    userPath = process.env.BASE_PATH || '/var/www/folders';
  } else {
    userPath = path.join(__dirname, '../folders');
  }
  
  const folderPath = path.join(userPath, userId);
  const configPath = path.join(folderPath, '.folder-config.json');
  
  // 유저 디렉토리가 없으면 생성
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  // 폴더 설정 생성 또는 로드
  let config: FolderConfig;
  
  if (fs.existsSync(configPath)) {
    // 기존 설정 로드
    const configData = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configData);
    
    // 설정 업데이트 (옵션이 제공된 경우)
    if (options) {
      if (options.password) {
        config.password = hashPassword(options.password);
      }
      if (options.maxSizeBytes !== undefined) {
        config.maxSizeBytes = options.maxSizeBytes;
      }
      
      // 변경된 설정 저장
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
  } else {
    // 새 설정 생성
    config = {
      id: userId,
      path: folderPath,
      createdAt: new Date()
    };
    
    if (options?.password) {
      config.password = hashPassword(options.password);
    }
    
    if (options?.maxSizeBytes !== undefined) {
      config.maxSizeBytes = options.maxSizeBytes;
    }
    
    // 새 설정 저장
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  
  return { folderPath, config};
};

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// 비밀번호 검증 함수 (추가 유틸리티)
export function verifyPassword(storedPassword: string, suppliedPassword: string): boolean {
  const [salt, hash] = storedPassword.split(':');
  const suppliedHash = crypto.pbkdf2Sync(suppliedPassword, salt, 1000, 64, 'sha512').toString('hex');
  return hash === suppliedHash;
}

// 폴더 사용량 확인 함수 (추가 유틸리티)
export function getFolderSize(folderPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let totalSize = 0;
    
    function calculateSize(dirPath: string): Promise<void> {
      return new Promise((resolveDir) => {
        fs.readdir(dirPath, { withFileTypes: true }, async (err, entries) => {
          if (err) {
            resolveDir();
            return;
          }
          
          const promises = entries.map(async (entry) => {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
              await calculateSize(fullPath);
            } else if (entry.isFile()) {
              const stat = await fs.promises.stat(fullPath);
              totalSize += stat.size;
            }
          });
          
          await Promise.all(promises);
          resolveDir();
        });
      });
    }
    
    calculateSize(folderPath)
      .then(() => resolve(totalSize))
      .catch(reject);
  });
}

// 용량 초과 여부 확인 함수 (추가 유틸리티)
export async function checkFolderSizeLimits(folderId: string): Promise<{ 
  currentSize: number; 
  maxSize?: number; 
  isExceeded: boolean 
}> {
  const { folderPath, config } = getUserDirectoryPath(folderId);
  const currentSize = await getFolderSize(folderPath);
  
  return {
    currentSize,
    maxSize: config.maxSizeBytes,
    isExceeded: config.maxSizeBytes ? currentSize > config.maxSizeBytes : false
  };
}

export const formatFileSize = (bytes: any) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 사용자 디렉토리와 그 안의 모든 내용을 삭제합니다.
 * @param userId 삭제할 폴더의 사용자 ID
 * @returns 삭제 성공 여부를 나타내는 객체
 */
export const deleteUserDirectory = (userId: string): { success: boolean; message: string } => {
  try {
    let userPath = '';
    if (process.env.NODE_ENV === 'production') {
      userPath = process.env.BASE_PATH || '/var/www/folders';
    } else {
      userPath = path.join(__dirname, '../folders');
    }
    
    const folderPath = path.join(userPath, userId);
    
    // 폴더가 존재하는지 확인
    if (!fs.existsSync(folderPath)) {
      return { 
        success: false, 
        message: `폴더가 존재하지 않습니다: ${userId}` 
      };
    }
    
    // 폴더와 그 안의 모든 내용을 재귀적으로 삭제
    fs.rmSync(folderPath, { recursive: true, force: true });
    
    return { 
      success: true, 
      message: `폴더를 성공적으로 삭제했습니다: ${userId}` 
    };
  } catch (error) {
    console.error(`폴더 삭제 중 오류 발생: ${userId}`, error);
    return {
      success: false,
      message: `폴더 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * 사용자 폴더 내의 특정 파일이나 하위 폴더를 삭제합니다.
 * @param userId 사용자 ID
 * @param itemPath 삭제할 항목의 상대 경로
 * @returns 삭제 성공 여부를 나타내는 객체
 */
export const deleteItemInUserDirectory = (userId: string, itemPath: string): { success: boolean; message: string } => {
  try {
    let userPath = '';
    if (process.env.NODE_ENV === 'production') {
      userPath = process.env.BASE_PATH || '/var/www/folders';
    } else {
      userPath = path.join(__dirname, '../folders');
    }
    
    const folderPath = path.join(userPath, userId);
    const itemFullPath = path.join(folderPath, itemPath);
    
    // 항목이 존재하는지 확인
    if (!fs.existsSync(itemFullPath)) {
      return { 
        success: false, 
        message: `항목이 존재하지 않습니다: ${itemPath}` 
      };
    }
    
    // 파일인지 폴더인지 확인
    const stats = fs.statSync(itemFullPath);
    
    if (stats.isDirectory()) {
      // 폴더인 경우 재귀적으로 삭제
      fs.rmSync(itemFullPath, { recursive: true, force: true });
    } else {
      // 파일인 경우 삭제
      fs.unlinkSync(itemFullPath);
    }
    
    return { 
      success: true, 
      message: `항목을 성공적으로 삭제했습니다: ${itemPath}` 
    };
  } catch (error) {
    console.error(`항목 삭제 중 오류 발생: ${itemPath}`, error);
    return {
      success: false,
      message: `항목 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const calculateFolderSize = (folderPath: string): number => {
  let totalSize = 0;
  if(folderPath.includes('.folder-config.json'))
  {
    totalSize += 0;
  }
  else 
  {
    // 폴더 내 모든 파일 및 디렉토리 읽기
    const items = fs.readdirSync(folderPath);
      
    for (const item of items) {
      // 숨겨진 설정 파일은 제외
      if (item === '.folder-config.json') {
        continue;
      }
      
      const itemPath = path.join(folderPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += calculateFolderSize(itemPath);
      }
    }
  }
  
  return totalSize;
};