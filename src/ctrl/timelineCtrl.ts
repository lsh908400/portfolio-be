import { Request, Response , NextFunction} from 'express';
import TimeLine from '../models/mysql/timeline';
import { successMessage } from '../constants/successMessage';
import { createBadRequestError, createNotFoundError } from '../constants/errorMessages';



export const getTimelines = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const timeline = await TimeLine.findAll({});

        if (!(timeline.length > 0)) {
            res.status(200).json({
                success: false,
                data: [],
                message: successMessage.timeline.noTimeline
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: timeline,
            message: successMessage.timeline.get
        });
        return;
    }
    catch(err)
    {
        console.error(err);
        return next(err);
    }
}

export const postTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const timeline = req.body;
        
        if (!timeline) {
            return next(createBadRequestError('timeline'))
        }
        
        if (!timeline.title || !timeline.date || !timeline.category) {
            return next(createBadRequestError('timeline'))
        }
        
        const newTimeline = await TimeLine.create({
            title: timeline.title,
            date: timeline.date,
            desc: timeline.desc || '',
            category: timeline.category,
            color: timeline.color || 'bg-gray-500'
        });
        
        
        res.status(201).json({
            success: true,
            message: successMessage.timeline.post
        });
    } catch (err) 
    {
        return next(err);
    }
};

export const deleteTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const {id} = req.params;
        if (!id) {
            return next(createBadRequestError('timeline'))
        }
        
        const timeline = await TimeLine.findByPk(id);
        
        if (!timeline) {
            return next(createNotFoundError('timeline'))
        }
        
        await timeline.destroy();
        
        res.status(200).json({
            success: true,
            message: successMessage.timeline.delete
        });
    }
    catch(err)
    {
        return next(err)
    }
}