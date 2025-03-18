import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BlockCollectionSchema, BlockSchema } from '../models/mongo/block';
import { deleteImageFile, processImageBlocks } from '../utils/fileHandler';

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
    // 기존 블록 조회 (이미지 삭제를 위해)
    const existingBlocks = await BlockModel.find({ parentId: id });
    
    // 이미지 블록 처리 및 parentId 추가
    const processedBlocks = await processImageBlocks(data, id);
    const blocksWithParentId = processedBlocks.map((block) => ({
      ...block,
      parentId: id
    }));
    
    // 기존 블록 삭제 전에 이미지 파일 삭제 처리
    for (const block of existingBlocks) {
      if (block.type === 'img' && block.data && block.data.url) {
        // 기존 이미지와 새 이미지를 비교하여 더 이상 사용되지 않는 이미지만 삭제
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