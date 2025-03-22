import mongoose, { Schema } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { createBadRequestError, createUnauthorizedError } from '../constants/errorMessages';

const frontendDir = path.resolve(__dirname, '../../../fe');
const backendDir = path.resolve(__dirname, '../../');

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
            {name: 'Main', path: '/src/component/pages/Home/VideoBackground.tsx'},
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
            {name: 'Block', path:'../be/src/ctrl/blockCtrl.ts'},
            {name: 'Uploads', path:'../be/src/utils/fileHandler.ts'},
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
            {name: 'FileService',path:'/src/component/pages/MiniProject/Front/ManageFile.tsx'},
        ],
        Back : [
            {name: 'TimeLine', path:'../be/src/ctrl/timelineCtrl.ts'},
            {name: 'Snippet', path:'../be/src/ctrl/snippetCtrl.ts'},
            {name: 'FileHandler',path:'../be/src/utils/fileHandler.ts'},
            {name: 'FileService',path:'../be/src/ctrl/folderCtrl.ts'},
        ],
        API : [
            {name: 'TimeLineFront', path: '/src/services/timeLineService.ts'},
            {name: 'TimeLineBack', path: '../be/src/routes/timelineRoutes.ts'},
            {name: 'SnippetFront', path: '/src/services/snippetService.ts'},
            {name: 'SnippetBack', path: '../be/src/routes/snippetRoutes.ts'},
            {name: 'FolderFront',path:'/src/services/folderService.ts'},
            {name: 'FolderBack', path:'../be/src/routes/folderRoutes.ts'},
        ]
    },
    'prevproject' : {
        Front : [
            {name: 'Prev-Project', path: '/src/pages/PrevProject.tsx'}
        ]
    },
    'version' : {
        Front : [
            {name: 'version-history', path: '/src/pages/Version.tsx' }
        ],
        Back : [
            {name: 'Version', path: '../be/src/ctrl/versionCtrl.ts'}
        ],
        API : [
            {name: 'VersionFront', path: '/src/services/versionService.ts'},
            {name: 'VersionBack', path: '../be/src/routes/versionRoutes.ts'}
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
export const putPageCode = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    const { pageName } = req.params;

    if (process.env.NODE_ENV === 'production') 
    {
        return next(createUnauthorizedError('code'))
    }
    
    if (!pageMapping[pageName]) {
        return next(createBadRequestError('code'))
    }
    
    const sourceCode = {
        API: pageMapping[pageName].API ? processFiles(pageMapping[pageName].API!) : '',
        Front: pageMapping[pageName].Front ? processFiles(pageMapping[pageName].Front!) : '',
        Back: pageMapping[pageName].Back ? processFiles(pageMapping[pageName].Back!, true) : ''
    };

    try {
        let codeMap = await CodeMapModel.findOne({ _id: 'main' });
        if (!codeMap) {
            codeMap = new CodeMapModel({ _id: 'main', data: {} });
        }

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

        res.status(200).json({
            success: true,
            data: sourceCode
        });
    } catch (error) {
        console.error('MongoDB 저장 오류:', error);
        return next(error);
    }
};

export const getPageCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { pageName } = req.params;
        
        const codeMapDoc = await CodeMapModel.findOne({ _id: 'main' });
        
        const codeMap = codeMapDoc?.data || {};
        
        if (!codeMap[pageName]) {
            return next(createBadRequestError('code'))
        }
        
        res.status(200).json({
            success: true,
            data: codeMap[pageName],
        });
    } catch (error) {
        console.error('MongoDB 읽기 오류:', error);
        return next(error)
    }
};