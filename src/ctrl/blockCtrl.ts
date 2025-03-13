import { Request, Response , NextFunction} from 'express';
import mongoose, { Schema } from 'mongoose';
import { BlockSchema } from '../models/mongo/block';
import { v4 as uuidv4 } from 'uuid';

const BlockModel = mongoose.model('Block', BlockSchema, 'block');

export const getBlocks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id, title } = req.query as { id: string, title: string };
        
        // parentId로 블록 조회
        let blocks = await BlockModel.find({ parentId: id });
        
        // 블록이 없는 경우 새로운 title 블록 생성
        // 조회된 블록이 있으면 그대로 반환
        res.json({
        success: true,
        data: blocks
        });
    } catch (error) {
        console.error('블록 조회/생성 오류:', error);
        return next(error);
    }
  };
