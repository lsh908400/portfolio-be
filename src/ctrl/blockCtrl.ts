import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BlockCollectionSchema, BlockSchema } from '../models/mongo/block';
import { v4 as uuidv4 } from 'uuid';

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

        let blocks = await BlockModel.find({ parentId: id });

        // 조회된 블록이 있으면 그대로 반환
        res.json({
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
      // 데이터와 ID 유효성 검사
      if (!data || !Array.isArray(data) || !id) {
        res.status(400).json({
          success: false,
          message: '유효하지 않은 데이터 형식입니다.'
        });
        return;
      }
      
      
      // 모든 블록에 parentId 추가
      const blocksWithParentId = data.map((block) => ({
        ...block,
        parentId: id
      }));
      
      // 기존 블록 삭제
      const deleteResult = await BlockModel.deleteMany({ parentId: id });
      
      // 새 블록 삽입
      const insertResult = await BlockModel.insertMany(blocksWithParentId);
      
      // 블록 컬렉션 확인
      let blockCollection = await BlockCollectionModel.findOne({ _id: id });
      
      if (blockCollection) {
        // 기존 컬렉션 업데이트
        blockCollection.updatedAt = new Date();
        await blockCollection.save();
        
        
        res.json({
          success: true,
          message: '작성중인 문서가 저장되었습니다.',
          data: { id, blocksCount: blocksWithParentId.length }
        });
      } else {
        // 새 컬렉션 생성
        const newBlockCollection = new BlockCollectionModel({
          _id: id,
          title: '제목 없음'
        });
        
        const saveResult = await newBlockCollection.save();
        console.log("새 컬렉션 저장 결과:", saveResult);
        
        res.json({
          success: true,
          message: '작성중인 문서가 저장되었습니다.',
          data: { id, blocksCount: blocksWithParentId.length }
        });
      }
    } catch (err) {
      console.error('블록 저장 오류 상세:', err);
      
      // 더 자세한 오류 정보 로깅
      if (err instanceof Error) {
        console.error('오류 메시지:', err.message);
        console.error('오류 스택:', err.stack);
      }
      
      res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
      return next(err);
    }
  };
