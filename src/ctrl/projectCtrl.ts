import { Request, Response , NextFunction} from 'express';
import Project from '../models/mysql/project';

export const getProject = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {type} = req.params;
        if(!type) return;
        const project = await Project.findAll({
            where: {
                type : [type]
            }
        });
        console.log(project)

        if (!(project.length > 0)) {
            res.status(204).json({
                success: false,
                message: '등록된 프로젝트가 없습니다.'
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: project,
            message: '프로젝트가 성공적으로 로드되었습니다.'
        });
        return; 
    }
    catch(err)
    {
        return next(err);
    }
}