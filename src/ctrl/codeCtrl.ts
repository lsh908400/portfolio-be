import mongoose, { Schema } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

// 프로젝트 루트 디렉토리 (프론트엔드 코드가 있는 위치)
const frontendDir = path.resolve(__dirname, '../../../fe');
const backendDir = path.resolve(__dirname, '../../');

// 페이지 이름과 파일 경로 매핑 (업데이트된 구조)
const pageMapping: Record<string, { 
    API?: string | Array<{name: string, path: string}>, 
    Front?: string | Array<{name: string, path: string}>, 
    Back?: string | Array<{name: string, path: string}> 
}> = {
    'profile': {
        Front: [
            {name: 'Profile', path: '/src/pages/Profile.tsx'},
            {name: 'Introduce', path: '/src/component/pages/Profile/Introduce.tsx'},
            {name: 'VariableInfo', path: '/src/component/util/VariableInfo.tsx'}
        ],
        Back: '../be/src/ctrl/profileCtrl.ts',
        API: [
            {name: 'ProfileFront', path: '/src/services/profileService.ts'},
            {name: 'ProfileBack', path: '../be/src/routes/profileRoutes.ts'},
        ]
    },
    'index' : {
        Front: [
            {name: 'App', path: '/src/App.tsx'},
            {name: 'Header', path: '/src/component/layout/Header.tsx'},
            {name: 'Aside', path: '/src/component/layout/Aside.tsx'},
            {name: 'Type', path: '/src/types/index.ts'},
            {name: 'Enum', path: '/src/types/enum.ts'},
        ],
        Back: '../be/src/ctrl/codeCtrl.ts',
        API: [
            {name: 'CodeFront', path:'/src/services/codeService.ts' },
            {name: 'CodeBack', path:'../be/src/routes/codeRoutes.ts'},
        ]
    },
    'trouble' : {
        Front: [
            {name: 'TroublShooting', path: '/src/pages/TroubleShooting.tsx'},
            {name: 'EditorAside', path:'/src/component/pages/TroubleShooting/EditorAside.tsx'},
            {name: 'PageIntroduce', path: '/src/component/pages/TroubleShooting/EditorIntro.tsx'},
            {name: 'Board', path: '/src/component/pages/TroubleShooting/EditorTable.tsx'},
            {name: 'CommonTable', path: '/src/component/util/CommonTable.tsx'},
            {name: 'Editor', path: '/src/component/pages/TroubleShooting/Editor.tsx'},
            {name: 'EditorHook', path: '/src/hooks/useEditorBlocks.tsx'},
            {name: 'EditorCodeBlock', path: '/src/component/pages/TroubleShooting/Type/CodeBlockComponent.tsx'},
            {name: 'EditorOption',path: '/src/component/pages/TroubleShooting/Menu/EditorOption.tsx'},
            {name: 'EditorMenu',path: '/src/component/pages/TroubleShooting/Menu/EditorTypeMenu.tsx'},
            {name: 'CommonColorPicker', path: '/src/component/util/CommonColorPicker.tsx'},
        ],
        Back: [
            {name: 'Category', path:'../be/src/ctrl/categoryCtrl.ts'},
            {name: 'Board', path:'../be/src/ctrl/boardCtrl.ts'},
            {name: 'Uploads', path:'../be/src/utils/fileHandler.ts'}
        ],
        API: [
            {name: 'CategoryFront', path:'/src/services/categoryService.ts'},
            {name: 'CategoryBack', path:'../be/src/routes/categoryRoutes.ts'},
            {name: 'BoardFront', path:'/src/services/boardService.ts'},
            {name: 'BoardBack', path:'../be/src/routes/boardRoutes.ts'},
        ]
    },
    'study' : {
        Front : [
            {name: 'Study', path: '/src/pages/Study.tsx'},
            {name: 'Aside', path: '/src/component/pages/Study/StudyAside.tsx'},
            {name: 'Content', path: '/src/component/pages/Study/StudyContent.tsx'}
        ],
        Back : [
            {name: 'Tree', path:'../be/src/ctrl/treeCtrl.ts'},
        ],
        API : [
            {name: 'StudyBack', path:'../be/src/routes/treeRoutes.ts'},
            {name: 'StudyFront', path:'/src/services/studyIntroService.ts'},
        ]
    },
    'mini' : {
        Front : [
            {name: 'Mini-Project', path: '/src/pages/MiniProject.tsx'},
            {name: 'Weather',path:'/src/component/pages/MiniProject/Front/Weather.tsx'},
            {name: 'TimeLine',path:'/src/component/pages/MiniProject/Front/TimeLine.tsx'},
            {name: 'CodeSnipet',path:'/src/component/pages/MiniProject/Front/CodeSnipet.tsx'},
        ]
    }

};

// 소스 파일 읽기 함수
const readSourceFile = (filePath: string, isBackend: boolean = false): string => {
    try {
        const baseDir = isBackend ? backendDir : frontendDir;
        const fullPath = path.join(baseDir, filePath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf8');
        }
        return `// 파일을 찾을 수 없습니다: ${filePath}`;
    } catch (error) {
        console.error(`파일 읽기 오류 (${filePath}):`, error);
        return `// 파일 읽기 오류: ${error instanceof Error ? error.message : String(error)}`;
    }
};

// 복수 파일 처리 함수
const processFiles = (
    fileEntries: string | Array<{name: string, path: string}>,
    isBackend: boolean = false
): string | Array<{name: string, content: string}> => {
    if (typeof fileEntries === 'string') {
        // 단일 문자열 경로인 경우
        return readSourceFile(fileEntries, isBackend);
    } else if (Array.isArray(fileEntries)) {
        // 배열인 경우 (하위 컴포넌트들)
        return fileEntries.map(entry => ({
            name: entry.name,
            content: readSourceFile(entry.path, isBackend)
        }));
    }
    return '';
};

// 간단한 모델 정의
const CodeMapSchema = new Schema({
    _id: String,
    data: Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
});

const CodeMapModel = mongoose.model('CodeMap', CodeMapSchema, 'codemap');

// 페이지 소스 코드 가져오기 API (기존 함수에 MongoDB 저장 기능 추가)
export const putPageCode = async (req: Request, res: Response): Promise<void> => {
    const { pageName } = req.params;
    
    if (!pageMapping[pageName]) {
        res.status(404).json({
            success: false,
            message: `${pageName} 페이지에 대한 매핑 정보가 없습니다.`
        });
        return;
    }
    
    const sourceCode = {
        API: pageMapping[pageName].API ? processFiles(pageMapping[pageName].API!) : '',
        Front: pageMapping[pageName].Front ? processFiles(pageMapping[pageName].Front!) : '',
        Back: pageMapping[pageName].Back ? processFiles(pageMapping[pageName].Back!, true) : ''
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