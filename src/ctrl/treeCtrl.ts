import { Request, Response , NextFunction} from 'express';
import Tree from '../models/mysql/tree';
import Purpose from '../models/mysql/purpose';
import { createBadRequestError } from '../constants/errorMessages';
import { successMessage } from '../constants/successMessage';



export const getTrees = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {type} = req.params;
        if(!type) {
            return next(createBadRequestError('tree'))
        };
        const trees = await Tree.findAll({
            where: {
                type : [type]
            }
        });

        if (!(trees.length > 0)) {
            res.status(200).json({
                success: false,
                data : [],
                message: successMessage.tree.noTree
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: trees,
            message: successMessage.tree.get
        });
        return;
    }
    catch(err)
    {
        console.error(err);
        return next(err);
    }
}

export const getPurpose = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {type} = req.params;
        if(!type) {
            return next(createBadRequestError('tree'))
        };
        const purpose = await Purpose.findAll({
            where: {
                type : [type]
            }
        });

        if (!(purpose.length > 0)) {
            res.status(200).json({
                success: false,
                data : [],
                message: successMessage.purpose.noPurpose
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: purpose,
            message: successMessage.purpose.get
        });
        return;
    }
    catch(err)
    {
        return next(err);
    }
}