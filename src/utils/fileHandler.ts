import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { CodeMap } from '../types/code';

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
    let filePath;

    if (process.env.NODE_ENV === 'production') {
      // 프로덕션 환경에서의 경로
      filePath = process.env.UPLOAD_PATH || '/var/www/uploads';
    } else {
      // 개발 환경에서의 경로 (기본값)
      filePath = path.join(__dirname, '../uploads', fileName);
    }
    
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
    
    const filePath = path.join(__dirname, '..', imagePath);
    
    try {
      await fsPromises.access(filePath);
      await fsPromises.unlink(filePath);
      console.log(`이미지 파일 삭제 완료: ${imagePath}`);
    } catch (error) {
      console.error(`이미지 파일 삭제 실패: ${imagePath}`, error);
    }
};