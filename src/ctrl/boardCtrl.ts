import { Request, Response , NextFunction} from 'express';
import Board from '../models/mysql/board';
import { Op, where } from 'sequelize';
import sequelize from '../config/mysqldb';
import { BlockSchema } from '../models/mongo/block';
import mongoose from 'mongoose';
import { createBadRequestError, createNotFoundError } from '../constants/errorMessages';
import { successMessage } from '../constants/successMessage';


export const getBoards = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try {
        const {categoryId} = req.params;
        if(!categoryId)
        {
            return next(createBadRequestError('board'))
        }

        const boards = await Board.findAll({
            where: {
                [Op.or]: [
                    { categoryId: 0 },
                    { categoryId: Number(categoryId) },
                ]
            },
            order: [
                [sequelize.literal(`CASE WHEN categoryId = 0 THEN 0 ELSE 1 END`), 'ASC'],
                ['id', 'DESC']
            ]
        });
        
        if (!(boards.length > 0)) {
            res.status(204).json({
                success: false,
                data: [],
                message: successMessage.board.noBoard
            })
            return;
        }
        
        res.status(200).json({
            success: true,
            data: boards,
            message: successMessage.board.get
        });
        return;
    }
    catch(err) {
        return next(err);
    }
}

export const postBoard = async (req : Request, res : Response, next : NextFunction) : Promise<void> => {
    try
    {
        const {categoryId , title} = req.body;

        if (!categoryId || !title) {
            return next(createBadRequestError('board'))
        }

        if (title.trim().length === 0) {
            return next(createBadRequestError('board'));
        }

        const board = await Board.create({
            categoryId: categoryId,
            title: title,
            createAt : new Date().toISOString().split('T')[0],
            modifyAt: ''
        });

        res.status(201).json({
            success: true,
            message: successMessage.board.post
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
            return next(createBadRequestError('board'))
        }
        
        const board = await Board.findOne({
            where : {
                id : id
            }
        })

        if (!board) {
            return next(createNotFoundError('board'))
        }

        if (board.title === title) {
            res.status(200).json({
                success: true,
                message: successMessage.board.aleadyTitleEq
            });
            return ;
        }

        board.title = title;
        await board.save();

        res.status(200).json({
            success : true,
            message : successMessage.board.patchTitle
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
            return next(createBadRequestError('board'))
        }
        
        const existingBoards = await Board.findAll({
            where: {
                id: {
                    [Op.in]: deleteIds
                }
            },
            attributes: ['id']
        });
        
        if (existingBoards.length === 0) {
            return next(createNotFoundError('board'));
        }

        const validBoardIds = existingBoards.map(board => board.id);
    
        
        
        try {
            const blockDeleteResult = await BlockModel.deleteMany({
                parentId: { $in: validBoardIds.map(id => id.toString()) }
            });
        } catch (mongoError) {
            console.error('블록 삭제 중 오류 발생:', mongoError);
            return next(createBadRequestError('block'));
        }

        const boardsDeletedCount = await Board.destroy({
            where: {
                id: {
                    [Op.in]: validBoardIds
                }
            }
        });
        
        res.status(200).json({
            success: true,
            message: successMessage.board.delete
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

        if (!option || !keyword || !categoryId) {
            return next(createBadRequestError('board'));
        }

        let searchCondition: any = {};
        
        if(keyword === '0')
        {
            const boards = await Board.findAll({
                where: {
                    [Op.or]: [
                        { categoryId: '0' },
                        { categoryId: Number(categoryId) },
                    ]
                },
                order: [
                    [sequelize.literal(`CASE WHEN categoryId = '0' THEN 0 ELSE 1 END`), 'ASC']
                ]
            });

            res.status(200).json({
                success: true,
                data: boards,
                message: successMessage.board.search
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
        
        const whereCondition = {
            [Op.or]: [
                { categoryId: '0' },  
                {
                    [Op.and]: [
                        searchCondition,   
                        { categoryId: categoryId }  
                    ]
                }
            ]
        };
        
        const boards = await Board.findAll({
            where: whereCondition,
            order: [
                [sequelize.literal(`CASE WHEN categoryId = '0' THEN 0 ELSE 1 END`), 'ASC']
            ]
        });
        
        if (boards.length === 0) {
            res.status(200).json({
                success: false,
                data: [],
                message: successMessage.board.noSearch
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: boards,
            message: successMessage.board.search
        });
        return;
    }
    catch(err)
    {
        return next(err)
    }
}