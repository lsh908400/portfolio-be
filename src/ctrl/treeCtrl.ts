import { Request, Response , NextFunction} from 'express';
import Tree from '../models/mysql/tree';
import Purpose from '../models/mysql/purpose';



export const getTrees = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {type} = req.params;
        console.log("tree",type)
        if(!type) return;
        const trees = await Tree.findAll({
            where: {
                type : [type]
            }
        });

        if (!(trees.length > 0)) {
            res.status(204).json({
                success: false,
                message: '등록된 Tree가 없습니다.'
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: trees,
            message: 'Tree가 성공적으로 로드되었습니다.'
        });
        return;
    }
    catch(err)
    {
        return next(err);
    }
}

export const getPurpose = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {type} = req.params;
        console.log("purpose",type)
        if(!type) return;
        const purpose = await Purpose.findAll({
            where: {
                type : [type]
            }
        });

        if (!(purpose.length > 0)) {
            res.status(204).json({
                success: false,
                message: '등록된 목표가 없습니다.'
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: purpose,
            message: '목표가 성공적으로 로드되었습니다.'
        });
        return;
    }
    catch(err)
    {
        return next(err);
    }
}