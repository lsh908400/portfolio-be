import { Request, Response , NextFunction} from 'express';
import Project from '../models/mysql/project';
import { createBadRequestError } from '../constants/errorMessages';
import { successMessage } from '../constants/successMessage';

export const getProject = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {type} = req.params;
        if(!type) {
            return next(createBadRequestError('project'))
        };
        const project = await Project.findAll({
            where: {
                type : [type]
            }
        });

        if (!(project.length > 0)) {
            res.status(200).json({
                success: false,
                message: successMessage.project.noProject
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: project,
            message: successMessage.project.get
        });
        return; 
    }
    catch(err)
    {
        return next(err);
    }
}