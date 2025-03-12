import { Request, Response , NextFunction} from 'express';
import { category } from '../types/category';
import Category from '../models/mysql/category';
import logger from '../utils/logger';


export const postCategory = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const category : category = req.body;
        if (!category.title || !category.icon) {
            res.status(400).json({
                success: false,
                message: 'title 및 icon 필드는 필수입니다.'
            });
            return;
        }

        const categoryModel = await Category.create({
            title: category.title,
            icon: category.icon
        });

        logger.info(`새 카테고리 생성: ${categoryModel.title} (ID: ${categoryModel.id})`);

        res.status(201).json({
            success: true,
            data: '카테고리가 성공적으로 추가되었습니다.',
            message: '카테고리가 성공적으로 추가되었습니다.'
        });
    } catch (error) {
        return next(error);
    }
};


export const getCategory = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const categories = await Category.findAll({
            attributes: ['id', 'title', 'icon']
        });
        

        res.status(201).json({
            success: true,
            data: categories,
        });
    } catch (error) {
        return next(error);
    }
};


export const deleteCategory = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const {id} = req.params;
        const category = await Category.findByPk(id);

        if (!category) {
            res.status(404).json({
              success: false,
              message: `ID ${id}에 해당하는 카테고리를 찾을 수 없습니다.`
            });
            return;
        }
        
        await category.destroy();

        res.status(201).json({
            success: true,
            data: null,
            message: '카테고리가 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        return next(error);
    }
};


export const putCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categories = req.body;
        console.log("수정할 카테고리:", categories);
        
        // 배열 형태로 받았는지 확인
        if (!Array.isArray(categories)) {
                res.status(400).json({
                success: false,
                message: '카테고리 데이터는 배열 형태여야 합니다.'
                });
            return;
        }
        
        // 트랜잭션 사용 (모든 수정이 성공하거나 모두 실패하도록)
        await Category.sequelize?.transaction(async (t) => {
            for (const category of categories) {
                // ID가 있는지 확인
                if (!category.id) {
                    throw new Error('카테고리 ID가 필요합니다.');
                }
                
                // 해당 ID의 카테고리 찾기
                const existingCategory = await Category.findByPk(category.id, { transaction: t });
                
                if (!existingCategory) {
                    throw new Error(`ID ${category.id}에 해당하는 카테고리를 찾을 수 없습니다.`);
                }
                
                // 카테고리 업데이트
                await existingCategory.update({
                    title: category.title,
                    icon: category.icon,
                    // 필요한 다른 필드들 추가
                }, { transaction: t });
            }
        });
      
      res.status(200).json({
        success: true,
        message: '카테고리가 성공적으로 수정되었습니다.'
      });
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '카테고리 수정 중 오류가 발생했습니다.'
      });
    }
  };