import mongoose from "mongoose";
import { Request, Response , NextFunction} from 'express';
import { SnippetSchema } from "../models/mongo/snippet";

const SnippetModel = mongoose.model('Snipet', SnippetSchema, 'snipet');

export const getSnippets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { 
            searchTerm, 
            tags, 
            cursor,  // 커서 기반 페이지네이션 
            limit = 10 
        } = req.query;
        console.log(searchTerm)
        // 동적 필터링 객체 생성
        const filter: any = {};
        if (searchTerm) {
            filter.title = { $regex: searchTerm, $options: 'i' }; // i 옵션은 대소문자 구분 없이 검색
        }
        if (tags) filter.tags = { $in: (tags as string).split(',') };

        // 커서 기반 페이지네이션 쿼리
        if (cursor) {
            filter.id = { $lt: cursor };  // 커서보다 작은 ID의 문서들
        }

        const snippets = await SnippetModel.find(filter)
            .sort({ _id: -1 })  // ID 역순 정렬
            .limit(Number(limit) + 1);  // 다음 페이지 존재 여부 확인을 위해 1개 더 가져옴

        // 다음 페이지 존재 여부 확인
        const hasNextPage = snippets.length > Number(limit);
        const finalSnippets = hasNextPage ? snippets.slice(0, -1) : snippets;

        // 다음 커서 설정 (마지막 아이템의 ID)
        const nextCursor = hasNextPage 
            ? finalSnippets[finalSnippets.length - 1].id 
            : null;

        res.status(200).json({
            success: true,
            data: finalSnippets,
            hasNextPage,
            nextCursor
        });
    } catch (error) {
        console.error('스니펫 조회 오류:', error);
        next(error);
    }
};

export const postSnippet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const {title, code, language, desc, tags} = req.body;
        
        if (!title || !code || !language) 
        {
            res.status(400).json({
            success: false,
            message: '제목, 코드, 언어는 필수 항목입니다.'
            });
            return;
        }
        
        const snippetData = {
            id: new mongoose.Types.ObjectId(), 
            title,
            code,
            language,
            desc: desc || '',
            tags: Array.isArray(tags) ? tags : [],
            createdAt: new Date()
        };

        const newSnippet = new SnippetModel(snippetData);
        
        const savedSnippet = await newSnippet.save();
        
        res.status(201).json({
            success: true,
            message: '스니펫이 성공적으로 등록되었습니다.',
            data: newSnippet
        });
    }
    catch(err)
    {
        console.error('스니펫 등록 오류: ',err)
        next(err)
    }
}

export const putSnippet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const {id,title, code, language, desc, tags} = req.body;
        if (!id) {
            res.status(400).json({
                success: false,
                message: '스니펫 ID가 필요합니다.'
            });
            return;
        }

        if (!title || !code || !language) {
            res.status(400).json({
                success: false,
                message: '제목, 코드, 언어는 필수 항목입니다.'
            });
            return;
        }

        const updateData = {
            title,
            code,
            language,
            description: desc || '',
            tags: Array.isArray(tags) ? tags : [],
        };

        const updatedSnippet = await SnippetModel.findOneAndUpdate(
            {id : id},
            updateData,
            { new: true, runValidators: true } 
        );

        if (!updatedSnippet) {
            res.status(404).json({
                success: false,
                message: '해당 ID의 스니펫을 찾을 수 없습니다.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: '스니펫이 성공적으로 수정되었습니다.',
        });
    }
    catch(err)
    {
        console.error('스니펫 수정 오류: ',err)
        next(err)
    }
}

export const deleteSnippet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const {id} = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                message: '스니펫 ID가 필요합니다.'
            });
            return;
        }

        const deleteSnippet = await SnippetModel.findOneAndDelete(
            {id : id},
        )

        if(!deleteSnippet){
            res.status(404).json({
                success: false,
                message: '해당 ID의 스니펫을 찾을 수 없습니다.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: '스니펫이 성공적으로 삭제되었습니다.'
        })
    }
    catch(err)
    {
        console.error('스니펫 삭제 오류: ',err)
        next(err);
    }
}
