import mongoose from "mongoose";
import { Request, Response , NextFunction} from 'express';
import { SnippetSchema } from "../models/mongo/snippet";
import { createBadRequestError, createNotFoundError } from "../constants/errorMessages";
import { successMessage } from "../constants/successMessage";

const SnippetModel = mongoose.model('Snipet', SnippetSchema, 'snipet');

export const getSnippets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { searchTerm, tags, cursor, limit} = req.query;
        
        const filter: any = {};
        if (searchTerm) {
            filter.title = { $regex: searchTerm, $options: 'i' }; 
        }
        if (tags) filter.tags = { $in: (tags as string).split(',') };

        if (cursor) {
            filter.id = { $lt: cursor };  
        }

        const snippets = await SnippetModel.find(filter)
            .sort({ _id: -1 }) 
            .limit(Number(limit) + 1);  

        const hasNextPage = snippets.length > Number(limit);
        const finalSnippets = hasNextPage ? snippets.slice(0, -1) : snippets;

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
            return next(createBadRequestError('snippet'))
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
            message: successMessage.snippet.post,
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
            return next(createBadRequestError('snippet'))
        }

        if (!title || !code || !language) {
            return next(createBadRequestError('snippet'))
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
            return next(createNotFoundError('snippet'))
        }

        res.status(200).json({
            success: true,
            message: successMessage.snippet.put,
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
            return next(createBadRequestError('snippet'))
        }

        const deleteSnippet = await SnippetModel.findOneAndDelete(
            {id : id},
        )

        if(!deleteSnippet){
            return next(createNotFoundError('snippet'))
        }

        res.status(200).json({
            success: true,
            message: successMessage.snippet.delete
        })
    }
    catch(err)
    {
        console.error('스니펫 삭제 오류: ',err)
        next(err);
    }
}
