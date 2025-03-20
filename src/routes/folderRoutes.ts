import { Router } from 'express';
import { deleteFolder, getFolder, postFolder, uploadFolder } from '../ctrl/folderCtrl';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// 업로드 디렉토리 설정
const uploadDir = path.join(process.cwd(), 'uploads');


const router = Router();

const folderConfig = {
    "root" : "/",
    "upload" : "/upload"
}

const fileUploadMiddleware = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            // 기본 경로 설정
            const basePath = process.env.BASE_PATH || '/folders';
            
            // folderName에서 폴더명 가져오기
            const folderName = req.body.folderName || 'uploads';
            const folderPath = req.body.folderPath || ''
            
            // 대상 디렉토리 경로 생성 (basePath + folderName)
            const targetDir = path.join(basePath, folderPath, folderName);
            
            // 디렉토리가 없으면 생성
            fs.mkdirSync(targetDir, { recursive: true });
            
            // 임시 폴더에 저장 (실제로 파일 저장하지 않고 폴더만 생성)
            cb(null, targetDir);
        },
        filename: function (req, file, cb) {
            // 파일명 원본 출력 (디버깅 용도)
            console.log('원본 파일명 (raw):', file.originalname);
            
            // 파일 경로에서 마지막 부분만 추출
            const originalPath = file.originalname.split('/');
            let fileName = originalPath[originalPath.length - 1];
            
            // Buffer로 변환 후 다시 디코딩 시도
            try {
                const buffer = Buffer.from(fileName, 'binary');
                fileName = buffer.toString('utf8');
            } catch (e) {
                console.error('버퍼 변환 실패:', e);
            }

            if (fileName.includes('�')) {
                // 깨진 문자가 포함된 경우 타임스탬프를 이용한 고유 이름 생성
                const timestamp = new Date().getTime();
                const extension = path.extname(fileName) || '.pdf';
                fileName = `file_${timestamp}${extension}`;
            }
            
            console.log('처리된 파일명:', fileName);
            cb(null, fileName);
        }
    })
}).array('files');


router.get('', getFolder);
router.post('', postFolder);
router.delete('',deleteFolder);
router.post(`${folderConfig.upload}`, fileUploadMiddleware, uploadFolder);



export default router;