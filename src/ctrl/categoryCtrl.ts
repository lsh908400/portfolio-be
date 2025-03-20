import { Request, Response , NextFunction} from 'express';
import { category } from '../types/category';
import Category from '../models/mysql/category';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import { BlockSchema } from '../models/mongo/block';
import Board from '../models/mysql/board';
import config from '../config/config';
import { createBadRequestError, createConflictError, createNotFoundError } from '../constants/errorMessages';
import { successMessage } from '../constants/successMessage';


export const postCategory = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const category : category = req.body;

        if (!category) {
            return next(createNotFoundError('category'));
        }

        if (!category.title || !category.icon) {
            return next(createNotFoundError('category'));
        }

        if (category.title.length > 50) {
            return next(createBadRequestError('category'));
        }

        const existingCategory = await Category.findOne({
            where : {title : category.title}
        });
        if (existingCategory) {
            return next(createConflictError('category'));
        }

        const categoryModel = await Category.create({
            title: category.title,
            icon: category.icon,
            type: 1
        });


        res.status(201).json({
            success: true,
            message: successMessage.category.post,
        });
    } catch (error) {
        return next(error);
    }
};


export const getCategory = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const {type} = req.params;

        if(!type)
        {
            return next(createBadRequestError('category'))
        }

        const categories = await Category.findAll({
            where : {
                type : type
            },
            attributes: ['id', 'title', 'icon']
        });
        

        res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error) {
        return next(error);
    }
};

const BlockModel = mongoose.model('Block', BlockSchema, 'block');
export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if(!id)
        {
            return next(createBadRequestError('category'))
        }

        const category = await Category.findByPk(id);
        
        if (!category) {
            return next(createNotFoundError('category'))
        }
        
        const boardsToDelete = await Board.findAll({
            where: { categoryId: id },
            attributes: ['id']
        });
        
        const boardIds = boardsToDelete.map(board => board.id);
        
        let blocksDeletedCount = 0;
        if (boardIds.length > 0) {
            try 
            {
                const blockDeleteResult = await BlockModel.deleteMany({
                    parentId: { $in: boardIds }
                });
                blocksDeletedCount = blockDeleteResult.deletedCount || 0;
            }
            catch(err)
            {
                console.error('블록 삭제 중 오류 발생:', err);
                return next(createBadRequestError('block'));
            }
            
        }
        
        const boardsDeletedCount = await Board.destroy({
            where: { categoryId: id }
        });

        // 마지막으로 카테고리 삭제
        await category.destroy();
        
        res.status(200).json({
            success: true,
            data: {
                categoryDeleted: 1,
                boardsDeleted: boardsDeletedCount,
                blocksDeleted: blocksDeletedCount
            },
            message: successMessage.category.delete
        });
    } catch (error) {
        return next(error);
    }
};


export const putCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categories = req.body;
        
        // 배열 형태로 받았는지 확인
        if (!Array.isArray(categories)) {
            return next(createBadRequestError('category'))
        }

        if (categories.length === 0) {
            return next(createBadRequestError('category'));
        }

        for (const category of categories) {
            if (!category.id) {
                return next(createBadRequestError('category','일부 카테고리에 ID가 누락되었습니다'));
            }
            
            if (!category.title || !category.icon) {
                return next(createBadRequestError('category','일부 카테고리에 필수 필드(title, icon)가 누락되었습니다'));
            }
        }
        
        await Category.sequelize?.transaction(async (t) => {
            for (const category of categories) {
                
                const existingCategory = await Category.findByPk(category.id, { transaction: t });
                
                if (!existingCategory) {
                    throw new Error(`ID ${category.id}에 해당하는 카테고리를 찾을 수 없습니다`);
                }
                
                // 카테고리 업데이트
                await existingCategory.update({
                    title: category.title,
                    icon: category.icon,
                }, { transaction: t });
            }
        });
      
        res.status(200).json({
            success: true,
            message: successMessage.category.put
        });
    } catch (error) {
        console.error('카테고리 수정 오류:', error);
        return next(error);
    }
  };