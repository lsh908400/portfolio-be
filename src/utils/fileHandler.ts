import fs from 'fs';
import path from 'path';
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
