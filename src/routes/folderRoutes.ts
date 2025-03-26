import { NextFunction, Request, Response, Router } from 'express';
import { deleteFolder, downloadFolderOrFile, getFolder, postFolder, uploadFolder } from '../ctrl/folderCtrl';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { calculateFolderSize, formatFileSize, getUserDirectoryPath } from '../utils/fileHandler';
import { randomUUID } from 'crypto';

// 업로드 디렉토리 설정
const uploadDir = path.join(process.cwd(), 'uploads');


const router = Router();

const folderConfig = {
    "root" : "/",
    "upload" : "/upload",
    "download" : "/download",
}

const checkStorage = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const basePath = process.env.BASE_PATH || '/folders';
    
    const folderName = req.body.folderName || 'uploads';
    const folderPath = req.body.folderPath || '';
    
    const {config} = getUserDirectoryPath(folderPath);
    const newPath = path.join(basePath, folderPath);
    const currentSizeBytes = calculateFolderSize(newPath);
    
    const capacity = (config.maxSizeBytes ? config.maxSizeBytes : 1073741824) - currentSizeBytes;
    
    if(capacity <= 0) {
      res.status(400).json({
        success: false,
        message: '저장 공간이 부족합니다.'
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('용량 체크 중 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// multer 설정 - 훨씬 단순화
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const basePath = process.env.BASE_PATH || '/folders';
      
      const folderName = req.body.folderName || 'uploads';
      const folderPath = req.body.folderPath || '';
      
      const targetDir = path.join(basePath, folderPath, folderName);
      const directory = path.join(folderPath, folderName);
      
      getUserDirectoryPath(directory);
      cb(null, targetDir);
    },
    filename: function (req, file, cb) {
      console.log('원본 파일명 (raw):', file.originalname);
      
      const originalPath = file.originalname.split('/');
      let fileName = originalPath[originalPath.length - 1];
      
      try {
        const buffer = Buffer.from(fileName, 'binary');
        fileName = buffer.toString('utf8');
      } catch (e) {
        console.error('버퍼 변환 실패:', e);
      }
      
      if (fileName.includes('�')) {
        const timestamp = new Date().getTime();
        const extension = path.extname(fileName) || '.pdf';
        fileName = `file_${timestamp}${extension}`;
      }
      
      console.log('처리된 파일명:', fileName);
      cb(null, fileName);
    }
  })
});

// 라우터 설정
router.get('', getFolder);
router.post('', postFolder);
router.delete('', deleteFolder);
router.post(`${folderConfig.upload}`, checkStorage, upload.array('files'), uploadFolder);
router.get(`${folderConfig.download}`,downloadFolderOrFile);

export default router;