import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { CodeMap } from '../types/code';
import * as crypto from 'crypto';
import { FolderConfig } from '../types/folder';
import { NextFunction, Response } from 'express';
import archiver from 'archiver';
import logger from './logger';
import { activeDownloadSessions, downloadHistory, downloadStates, io } from '../app';

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


export const getFilePath = (filePath : string, fileName : string) : string => {
  let userPath = '';
  if (process.env.NODE_ENV === 'production') {
  userPath = process.env.BASE_PATH || '/var/www/folders';
  } else {
  userPath = path.join(__dirname, '../folders');
  }
  
  const folderPath = path.join(userPath, filePath.toString());
  const itemFullPath = path.join(folderPath, fileName.toString());

  return itemFullPath;
}

export const downloadFile = async (itemFullPath: string, fileName: string, contentType: string, downloadId: string, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rangeHeader = res.req.headers.range;
    const fileSize = (await fs.promises.stat(itemFullPath)).size;
    
    let progressInterval: NodeJS.Timeout;
    let bytesRead = 0;

    if (!downloadStates.has(downloadId)) {
      downloadStates.set(downloadId, {
        status: 'preparing',
        downloadId,
        isCompleted: false,
        currentProgress: 0
      });
    }

    if (!downloadHistory.has(downloadId)) {
      downloadHistory.set(downloadId, []);
    }

    const saveAndEmitEvent = (eventName: string, data: any) => {
      const eventData = { ...data, downloadId };
  
      downloadStates.set(downloadId, {
        ...downloadStates.get(downloadId),
        ...eventData,
        lastUpdated: Date.now()
      });
      
      // 히스토리에 이벤트 추가
      if (!downloadHistory.has(downloadId)) {
        downloadHistory.set(downloadId, []);
      }
      
      downloadHistory.get(downloadId).push({
        eventName,
        data: eventData,
        timestamp: Date.now()
      });
      
      io.to(`download:${downloadId}`).emit(eventName, eventData);
    };
    
    saveAndEmitEvent('download:start', {
      status: 'downloading',
      fileSize,
      fileSizeFormatted: formatBytes(fileSize),
      fileName,
      currentProgress: 0
    });
    
    progressInterval = setInterval(() => {
      const progress = Math.min(Math.round((bytesRead / fileSize) * 100), 100);
      
      saveAndEmitEvent('download:progress', {
        status: 'downloading',
        progress,
        bytesRead,
        bytesReadFormatted: formatBytes(bytesRead),
        totalSizeFormatted: formatBytes(fileSize),
        currentProgress: progress
      });
      
      // 다운로드 완료 시 타이머 정리
      if (bytesRead >= fileSize) {
        clearInterval(progressInterval);
      }
    }, 300);
    
    // 범위 요청 처리
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize) {
        clearInterval(progressInterval);
        res.status(416).send('Requested Range Not Satisfiable');
        
        // 에러 알림
        saveAndEmitEvent('download:error', {
          status: 'error',
          message: '요청된 범위가 유효하지 않습니다',
          isCompleted: true,
          endType: 'error'
        });
        return;
      }
      
      const chunkSize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      
      // 인위적으로 버퍼 크기를 작게 설정하여 작은 파일도 여러 청크로 분할
      const fileStream = fs.createReadStream(itemFullPath, { 
        start, 
        end,
        highWaterMark: 1024 * 16 // 16KB 청크 (기본보다 작음)
      });
      
      fileStream.on('data', (chunk) => {
        bytesRead += chunk.length;
      });
      
      fileStream.on('end', () => {
        clearInterval(progressInterval);
        
        saveAndEmitEvent('download:complete', {
          status: 'complete',
          fileSize,
          fileSizeFormatted: formatBytes(fileSize),
          progress: 100,
          currentProgress: 100,
          isCompleted: true,
          endType: 'success'
        });

        setTimeout(() => {
          downloadStates.delete(downloadId);
          downloadHistory.delete(downloadId);
        }, 30 * 60 * 1000);
      });
      
      fileStream.on('error', (err) => {
        clearInterval(progressInterval);
        
        saveAndEmitEvent('download:error', {
          status: 'error',
          message: '파일 읽기 오류가 발생했습니다',
          isCompleted: true,
          endType: 'error'
        });
        
        next(err);
      });
      
      res.on('close', () => {
        clearInterval(progressInterval);
        
        if (!res.writableEnded) {
          saveAndEmitEvent('download:canceled', {
            status: 'canceled',
            message: '다운로드가 취소되었습니다',
            isCompleted: true,
            endType: 'canceled'
          });
          fileStream.destroy();
        }
      });
      
      fileStream.pipe(res);
    } else {
      // 일반 요청 처리
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      
      // 인위적으로 버퍼 크기를 작게 설정
      const fileStream = fs.createReadStream(itemFullPath, {
        highWaterMark: 1024 * 16 // 16KB 청크
      });
      
      fileStream.on('data', (chunk) => {
        bytesRead += chunk.length;
      });
      
      fileStream.on('end', () => {
        clearInterval(progressInterval);
        
        // 다운로드 완료 알림
        saveAndEmitEvent('download:complete', {
          status: 'complete',
          fileSize,
          fileSizeFormatted: formatBytes(fileSize),
          progress: 100,
          currentProgress: 100,
          isCompleted: true,
          endType: 'success'
        });
        
        // 30분 후 상태 및 히스토리 정보 삭제
        setTimeout(() => {
          downloadStates.delete(downloadId);
          downloadHistory.delete(downloadId);
        }, 30 * 60 * 1000);
      });
      
      fileStream.on('error', (err) => {
        clearInterval(progressInterval);
        
        saveAndEmitEvent('download:error', {
          status: 'error',
          message: '파일 읽기 오류가 발생했습니다',
          isCompleted: true,
          endType: 'error'
        });
        
        next(err);
      });
      
      res.on('close', () => {
        clearInterval(progressInterval);
        
        if (!res.writableEnded) {
          saveAndEmitEvent('download:canceled', {
            status: 'canceled',
            message: '다운로드가 취소되었습니다',
            isCompleted: true,
            endType: 'canceled'
          });
          fileStream.destroy();
        }
      });
      
      fileStream.pipe(res);
    }
  } catch (err) {
    logger.error('파일 다운로드 에러:', err);
    if (downloadStates.has(downloadId)) {
      downloadStates.set(downloadId, {
        ...downloadStates.get(downloadId),
        status: 'error',
        message: '파일 다운로드를 시작할 수 없습니다',
        isCompleted: true,
        endType: 'error'
      });
    }

    io.emit('download:error', {
      status: 'error',
      message: '파일 다운로드를 시작할 수 없습니다',
      downloadId,
      isCompleted: true,
      endType: 'error'
    });
    next(err);
  }
};

export const downloadFolder = async (itemFullPath: string, folderName: string, downloadId: string, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folderName)}.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    let filesCount = 0;
    let processedCount = 0;
    let totalSize = 0;
    let processedSize = 0;

    // 다운로드 시작 시 항상 초기화
    downloadStates.set(downloadId, {
      status: 'preparing',
      downloadId,
      isCompleted: false,
      currentProgress: 0
    });

    // 히스토리도 초기화(필요하다면)
    downloadHistory.set(downloadId, []);

    // 이벤트 저장과 발송을 분리
    const saveEvent = (eventName: string, data: any) => {
      const eventData = { ...data, downloadId };
      
      // 현재 상태 업데이트
      downloadStates.set(downloadId, {
        ...downloadStates.get(downloadId),
        ...eventData,
        lastUpdated: Date.now()
      });
      
      // 히스토리에 이벤트 추가
      downloadHistory.get(downloadId)?.push({
        eventName,
        data: eventData,
        timestamp: Date.now()
      });
      
      return eventData;
    };
    
    // 실제 이벤트 발송 - 특정 세션 룸에만 발송하도록 수정
    const emitEvent = (eventName: string, data: any) => {
      const downloadId = data.downloadId;
      
      // 해당 다운로드 세션에 연결된 클라이언트에게만 이벤트 발송
      io.to(`download:${downloadId}`).emit(eventName, data);
      
      // 다운로드 완료 이벤트인 경우 세션 정리 로직 추가 (선택적)
      if (eventName === 'download:complete' || eventName === 'download:error' || eventName === 'download:canceled') {
        // 활성 세션 표시 제거 (activeDownloadSessions 맵을 사용한다고 가정)
        if (typeof activeDownloadSessions !== 'undefined' && activeDownloadSessions.has(downloadId)) {
          activeDownloadSessions.delete(downloadId);
        }
      }
    };
    
    // 저장 후 발송
    const saveAndEmitEvent = (eventName: string, data: any) => {
      const eventData = saveEvent(eventName, data);
      emitEvent(eventName, eventData);
    };
    
    // 폴더 분석 시작 알림
    saveAndEmitEvent('download:analyzing', {
      status: 'analyzing',
      message: '폴더 내용 분석 중...'
    });

    // 폴더 내용 분석
    await calculateFolderStats(itemFullPath, (count, size) => {
      filesCount = count;
      totalSize = size;
      logger.info(`Starting compression of ${filesCount} files, total size: ${formatBytes(totalSize)}`);
      
      // 분석 완료 알림
      saveAndEmitEvent('download:start', {
        status: 'compressing',
        fileCount: filesCount,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        folderName,
        currentProgress: 0
      });
    });
    
    // 진행 상황 주기적 전송 설정 (더 빈번하게 업데이트)
    const progressInterval = setInterval(() => {
      const progress = totalSize > 0 ? Math.round((processedSize / totalSize) * 100) : 0;
      
      // 직접 이벤트 발송 (상태 저장보다 우선시)
      emitEvent('download:progress', {
        status: 'compressing',
        progress,
        processedCount,
        fileCount: filesCount,
        processedSize,
        processedSizeFormatted: formatBytes(processedSize),
        totalSizeFormatted: formatBytes(totalSize),
        currentProgress: progress,
        downloadId
      });
      
      // 상태도 업데이트
      saveEvent('download:progress', {
        status: 'compressing',
        progress,
        processedCount,
        fileCount: filesCount,
        processedSize,
        processedSizeFormatted: formatBytes(processedSize),
        totalSizeFormatted: formatBytes(totalSize),
        currentProgress: progress
      });
    }, 300); // 300ms로 업데이트 빈도 증가
    
    // 진행 상황 모니터링
    archive.on('entry', (entry) => {
      processedCount++;
      processedSize += entry.stats?.size ?? 0;
      
      const progress = Math.round((processedSize / totalSize) * 100);
      logger.info(`Compression progress: ${progress}% (${processedCount}/${filesCount} files)`);
      
      // 중요한 진행 단계에서 로그 기록
      if (progress % 10 === 0 || processedCount === filesCount) {
        logger.info(`Compression milestone: ${progress}% complete`);
      }
      
      // 현재 처리 중인 파일 정보 즉시 발송
      emitEvent('download:file-processed', {
        status: 'compressing',
        currentFile: entry.name ? path.basename(entry.name) : '알 수 없는 파일',
        processedCount,
        fileCount: filesCount,
        currentProgress: progress,
        downloadId
      });
      
      // 상태도 업데이트
      saveEvent('download:file-processed', {
        status: 'compressing',
        currentFile: entry.name ? path.basename(entry.name) : '알 수 없는 파일',
        processedCount,
        fileCount: filesCount,
        currentProgress: progress
      });
    });
    
    archive.on('finish', () => {
      logger.info(`Compression completed: ${processedCount} files (${formatBytes(processedSize)})`);
    });
    
    archive.on('error', (err: any) => {
      clearInterval(progressInterval);
      console.error(err);
      logger.error('Archive error:', err);
      
      saveAndEmitEvent('download:error', {
        status: 'error',
        message: '압축 중 오류가 발생했습니다',
        isCompleted: true,
        endType: 'error'
      });
      
      next(err);
    });
    
    archive.on('end', () => {
      clearInterval(progressInterval);
      const finalSize = archive.pointer();
      logger.info(`Archive size: ${formatBytes(finalSize)}`);
      
      saveAndEmitEvent('download:complete', {
        status: 'complete',
        fileCount: filesCount,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        archiveSize: finalSize,
        archiveSizeFormatted: formatBytes(finalSize),
        compressionRatio: totalSize > 0 ? Math.round((finalSize / totalSize) * 100) : 0,
        progress: 100,
        currentProgress: 100,
        isCompleted: true,
        endType: 'success'
      });

      setTimeout(() => {
        downloadStates.delete(downloadId);
        downloadHistory.delete(downloadId);
      }, 30 * 60 * 1000);
    });
    
    res.on('close', () => {
      clearInterval(progressInterval);
      logger.info('Client connection closed');
      
      if (!res.writableEnded) {
        saveAndEmitEvent('download:canceled', {
          status: 'canceled',
          message: '다운로드가 취소되었습니다',
          isCompleted: true,
          endType: 'canceled'
        });
        archive.abort();
      }
    });
    
    archive.pipe(res);
    archive.directory(itemFullPath, folderName);
    
    await archive.finalize();
  } catch (err) {
    logger.error('폴더 다운로드 에러:', err);
    if (downloadStates.has(downloadId)) {
      downloadStates.set(downloadId, {
        ...downloadStates.get(downloadId),
        status: 'error',
        message: '폴더 다운로드를 시작할 수 없습니다',
        isCompleted: true,
        endType: 'error'
      });
    }
    
    io.emit('download:error', {
      status: 'error',
      message: '폴더 다운로드를 시작할 수 없습니다',
      downloadId,
      isCompleted: true,
      endType: 'error'
    });
    next(err);
  }
};

export const sanitizePath = (unsafePath: string): string => {
  const safePath = path.normalize(unsafePath).replace(/^(\.\.[\/\\])+/, '');
  return safePath;
}

export const determineContentType = (filePath: string): string => {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // 더 많은 MIME 타입 추가...
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

async function calculateFolderStats(folderPath: string, callback: (fileCount: number, totalSize: number) => void): Promise<void> {
  let fileCount = 0;
  let totalSize = 0;
  
  async function processDirectory(dirPath: string) {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
              await processDirectory(fullPath);
          } else if (entry.isFile()) {
              fileCount++;
              const stats = await fs.promises.stat(fullPath);
              totalSize += stats.size;
          }
      }
  }
  
  await processDirectory(folderPath);
  callback(fileCount, totalSize);
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}