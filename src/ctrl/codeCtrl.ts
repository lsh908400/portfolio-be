import mongoose, { Schema } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

// 프로젝트 루트 디렉토리 (프론트엔드 코드가 있는 위치)
const frontendDir = path.resolve(__dirname, '../../../fe');

// 페이지 이름과 파일 경로 매핑
const pageMapping: Record<string, { 
  HTML?: string, 
  API?: string, 
  JS?: string, 
  Front?: string, 
  Back?: string 
}> = {
  'profile': {
    Front: '/src/component/pages/Profile/Introduce.tsx',
    Back: '../be/src/ctrl/profileCtrl.ts',
    API: '/src/services/profileService.ts'
  },
  'index' : {
    Front: '/src/component/pages/Home/VideoBackground.tsx',
    Back: '../be/src/ctrl/codeCtrl.ts',
    API: '/src/services/codeService.ts'
  }
  // 다른 페이지 매핑 추가
};

// 소스 파일 읽기 함수
const readSourceFile = (filePath: string): string => {
    try {
        const fullPath = path.join(frontendDir, filePath);
        if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
        }
        return `// 파일을 찾을 수 없습니다: ${filePath}`;
    } catch (error) {
        console.error(`파일 읽기 오류 (${filePath}):`, error);
        return `// 파일 읽기 오류: ${error instanceof Error ? error.message : String(error)}`;
    }
};

// 페이지 소스 코드 가져오기 API
// 간단한 모델 정의
const CodeMapSchema = new Schema({
    _id: String,
    data: Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
});

const CodeMapModel = mongoose.model('CodeMap', CodeMapSchema, 'codemap');

// 기존 함수에 MongoDB 저장 기능 추가
export const putPageCode = async (req: Request, res: Response): Promise<void> => {
    const { pageName } = req.params;
    console.log(pageName);
    
    if (!pageMapping[pageName]) {
        res.status(404).json({
            success: false,
            message: `${pageName} 페이지에 대한 매핑 정보가 없습니다.`
        });
        return;
    }
    
    const sourceCode = {
        HTML: pageMapping[pageName].HTML ? readSourceFile(pageMapping[pageName].HTML!) : '',
        API: pageMapping[pageName].API ? readSourceFile(pageMapping[pageName].API!) : '',
        JS: pageMapping[pageName].JS ? readSourceFile(pageMapping[pageName].JS!) : '',
        Front: pageMapping[pageName].Front ? readSourceFile(pageMapping[pageName].Front!) : '',
        Back: pageMapping[pageName].Back ? readSourceFile(pageMapping[pageName].Back!) : ''
    };

    try {
        // MongoDB에서 코드맵 가져오기
        let codeMap = await CodeMapModel.findOne({ _id: 'main' });
        if (!codeMap) {
            // 없으면 새로 생성
            codeMap = new CodeMapModel({ _id: 'main', data: {} });
        }

        // 페이지 코드 저장
        codeMap.data[pageName] = sourceCode;
        codeMap.updatedAt = new Date();
        
        await CodeMapModel.updateOne(
            { _id: 'main' },
            { 
                $set: { 
                    [`data.${pageName}`]: sourceCode, 
                    updatedAt: new Date() 
                } 
            },
            { upsert: true }
        );

        res.json({
            success: true,
            data: sourceCode
        });
    } catch (error) {
        console.error('MongoDB 저장 오류:', error);
        res.json({
            success: true, // 파일 내용은 성공적으로 가져왔으므로 success: true 유지
            data: sourceCode,
            message: 'MongoDB에 저장하는 데 실패했지만 파일 내용은 성공적으로 가져왔습니다.'
        });
    }
};


// 특정 페이지 코드 데이터 가져오기
export const getPageCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { pageName } = req.params;
        
        // MongoDB에서 데이터 가져오기
        const CodeMapModel = mongoose.model('CodeMap');
        const codeMapDoc = await CodeMapModel.findOne({ _id: 'main' });
        
        // 데이터가 없으면 빈 객체 사용
        const codeMap = codeMapDoc?.data || {};
        
        if (!codeMap[pageName]) {
            res.status(404).json({
            success: false,
            message: `${pageName} 페이지의 코드 데이터를 찾을 수 없습니다.`,
            });
            return;
        }
        
        res.json({
            success: true,
            data: codeMap[pageName],
        });
        } catch (error) {
        console.error('MongoDB 읽기 오류:', error);
        res.status(500).json({
            success: false,
            message: '코드 데이터를 가져오는 중 오류가 발생했습니다.',
            error: (error as Error).message,
        });
    }
};

