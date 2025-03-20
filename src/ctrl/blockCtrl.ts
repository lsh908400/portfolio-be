import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BlockCollectionSchema, BlockSchema } from '../models/mongo/block';
import { deleteImageFile, processImageBlocks } from '../utils/fileHandler';
import { createBadRequestError, createNotFoundError } from '../constants/errorMessages';
import { successMessage } from '../constants/successMessage';
import Board from '../models/mysql/board';

// 모델 정의 - 변수명 충돌 해결
const BlockModel = mongoose.model('Block', BlockSchema, 'block');
const BlockCollectionModel = mongoose.model(
    'BlockCollection',
    BlockCollectionSchema,
    'blockcollection'
);

export const getBlocks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.query as { id: string };

        if(!id || id.trim() === '')
        {
          return next(createBadRequestError('block'))
        }

        let blocks = await BlockModel.find({ parentId: id });

        res.status(200).json({
          success: true,
          data: blocks,
        });
        return;
    } catch (error) {
        console.error('블록 조회 오류:', error);
        return next(error);
    }
};

export const postBlocks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data, id } = req.body;
    
    if (!data || !Array.isArray(data) || !id) {
      return next(createBadRequestError('block'))
    }
    const existingBlocks = await BlockModel.find({ parentId: id });
    
    const processedBlocks = await processImageBlocks(data, id);
    const blocksWithParentId = processedBlocks.map((block) => ({
      ...block,
      parentId: id
    }));
    
    for (const block of existingBlocks) {
      if (block.type === 'img' && block.data && block.data.url) {
        const stillInUse = processedBlocks.some(
          newBlock => newBlock.type === 'img' && 
                      newBlock.data && 
                      newBlock.data.url === block.data?.url
        );
        
        if (!stillInUse && !block.data.url.startsWith('data:')) {
          await deleteImageFile(block.data.url);
        }
      }
    }
    
    const deleteResult = await BlockModel.deleteMany({ parentId: id });
    
    const insertResult = await BlockModel.insertMany(blocksWithParentId);
    
    let blockCollection = await BlockCollectionModel.findOne({ _id: id });
    
    if (blockCollection) {
      blockCollection.updatedAt = new Date();
      await blockCollection.save();

      const [updatedRowsCount] = await Board.update(
        { modifyAt : new Date().toISOString().split('T')[0] },
        { where: { id: id } }
      );

      if (updatedRowsCount === 0) {
        return next(createNotFoundError('board'));
      }
      
      res.json({
        success: true,
        message: successMessage.block.post,
        data: { id, blocksCount: blocksWithParentId.length }
      });
    } else {
      const newBlockCollection = new BlockCollectionModel({
        _id: id,
        title: '제목 없음'
      });
      
      const saveResult = await newBlockCollection.save();
      
      res.status(200).json({
        success: true,
        message: successMessage.block.post,
        data: { id, blocksCount: blocksWithParentId.length }
      });
    }
  } catch (err) {
    console.error('블록 저장 오류 상세:', err);

    return next(err);
  }
};