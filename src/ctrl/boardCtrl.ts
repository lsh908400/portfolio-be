import { Request, Response , NextFunction} from 'express';
import Board from '../models/mysql/board';
import { Op, where } from 'sequelize';
import sequelize from '../config/mysqldb';
import { BlockSchema } from '../models/mongo/block';
import mongoose from 'mongoose';


export const getBoards = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {categoryId} = req.params;
        const boards = await Board.findAll({
            where: {
                [Op.or]: [
                    { categoryId: '0' },
                    { categoryId: categoryId },
                ]
            },
            order: [
                [sequelize.literal(`CASE WHEN categoryId = '0' THEN 0 ELSE 1 END`), 'ASC']
            ]
        });

        if (!(boards.length > 0)) {
            res.status(204).json({
                success: false,
                message: '등록된 게시판이 없습니다.'
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: boards,
            message: '게시판이 성공적으로 로드되었습니다.'
        });
        return;
    }
    catch(err)
    {
        return next(err);
    }
}

export const postBoard = async (req : Request, res : Response, next : NextFunction) : Promise<void> => {
    try
    {
        const {categoryId , title} = req.body;

        if (!categoryId || !title) {
            res.status(400).json({
                success: false,
                message: '카테고리 및 제목 필드는 필수입니다.'
            });
            return;
        }

        const board = await Board.create({
            categoryId: categoryId,
            title: title,
            createAt : new Date().toISOString().split('T')[0],
            modifyAt: ''
        });

        res.status(201).json({
            success: true,
            data: '게시글이 성공적으로 추가되었습니다.',
            message: '게시글이 성공적으로 추가되었습니다.'
            
        });

        return;
    }
    catch(err)
    {
        return next(err)
    }
}

export const patchBoardTitle = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try
    {
        const {id, title} = req.body;

        if (!id || !title) {
            res.status(400).json({
                success: false,
                message: '제목 필드는 필수입니다.'
            });
            return;
        }
        
        const board = await Board.findOne({
            where : {
                id : id
            }
        })

        if (!board) {
            res.status(404).json({
                success: false,
                message: '해당 게시글을 찾을 수 없습니다.'
            });
            return;
        }

        board.title = title;
        await board.save();

        res.status(201).json({
            success : true,
            message : "제목이 성공적으로 변경되었습니다."
        })
    }
    catch(err)
    {
        return next(err);
    }
}


const BlockModel = mongoose.model('Block', BlockSchema, 'block');
export const deleteBoards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { deleteIds } = req.body;
        
        if (!deleteIds || !Array.isArray(deleteIds) || deleteIds.length === 0) {
            res.status(400).json({
                success: false,
                message: '삭제할 게시글 ID가 제공되지 않았습니다.'
            });
            
            return;
        }
        
        // MySQL에서 Board 삭제
        const deletedCount = await Board.destroy({
            where: {
                id: {
                    [Op.in]: deleteIds
                }
            }
        });
        
        if (deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: '삭제할 게시글을 찾을 수 없습니다.'
            });
            return;
        }
        
        // MongoDB에서 관련된 Block 삭제
        const blockDeleteResult = await BlockModel.deleteMany({ 
            parentId: { $in: deleteIds } 
        });
        
        res.status(201).json({
            success: true,
            data: {
                boardsDeleted: deletedCount,
                blocksDeleted: blockDeleteResult.deletedCount || 0
            },
            message: '게시글과 관련 블록이 성공적으로 삭제되었습니다.'
        });
        
        return;
    } catch (err) {
        return next(err);
    }
};


export const searchBoards = async (req:Request, res : Response , next : NextFunction) : Promise<void> => {
    try
    {
        const {option, keyword, categoryId} = req.params;
        let searchCondition: any = {};
        
        if(keyword === '0')
        {
            const boards = await Board.findAll({
                where: {
                    [Op.or]: [
                        { categoryId: '0' },
                        { categoryId: categoryId },
                    ]
                },
                order: [
                    [sequelize.literal(`CASE WHEN categoryId = '0' THEN 0 ELSE 1 END`), 'ASC']
                ]
            });

            res.status(201).json({
                success: true,
                data: boards,
                message: '게시판이 성공적으로 로드되었습니다.'
            });
            return;
        }

        if (option === 'title') {
            searchCondition = {
                title: {
                    [Op.like]: `%${keyword}%`
                }
            };
        } else if (option === 'createAt') {
            searchCondition = {
                createAt: {
                    [Op.like]: `%${keyword}%`
                }
            };
        } else if (option === 'modifyAt') {
            searchCondition = {
                modifyAt: {
                    [Op.like]: `%${keyword}%`
                }
            };
        }
        
        // 최종 where 조건 구성 (카테고리 ID가 0이거나 검색 조건에 맞는 경우)
        const whereCondition = {
            [Op.or]: [
                { categoryId: '0' },  // 카테고리 ID가 0인 게시글은 항상 포함
                {
                    [Op.and]: [
                        searchCondition,   // 검색 조건
                        { categoryId: categoryId }  // 현재 카테고리 조건
                    ]
                }
            ]
        };
        
        // 게시글 검색 및 카테고리 ID 0인 게시글 우선 정렬
        const boards = await Board.findAll({
            where: whereCondition,
            order: [
                [sequelize.literal(`CASE WHEN categoryId = '0' THEN 0 ELSE 1 END`), 'ASC']
            ]
        });
        
        if (boards.length === 0) {
            res.status(204).json({
                success: false,
                message: '검색 결과가 없습니다.'
            });
            return;
        }
        res.status(201).json({
            success: true,
            data: boards,
            message: '게시판이 성공적으로 로드되었습니다.'
        });
        return;
    }
    catch(err)
    {
        return next(err)
    }
}