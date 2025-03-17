import { Request, Response , NextFunction} from 'express';
import TimeLine from '../models/mysql/timeline';



export const getTimelines = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const timeline = await TimeLine.findAll({});

        if (!(timeline.length > 0)) {
            res.status(204).json({
                success: false,
                message: '등록된 타임라인이 없습니다.'
            })
            return;
        }

        res.status(200).json({
            success: true,
            data: timeline,
            message: '타임라인이 성공적으로 로드되었습니다.'
        });
        return;
    }
    catch(err)
    {
        return next(err);
    }
}

export const postTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const timeline = req.body;
        
        if (!timeline) {
            res.status(400).json({
                success: false,
                data: null,
                message: '타임라인 데이터가 제공되지 않았습니다.'
            });
            return;
        }
        
        if (!timeline.title || !timeline.date || !timeline.category) {
            res.status(400).json({
                success: false,
                data: null,
                message: '제목, 날짜, 카테고리는 필수 항목입니다.'
            });
            return;
        }
        
        const newTimeline = await TimeLine.create({
            title: timeline.title,
            date: timeline.date,
            desc: timeline.desc || '',
            category: timeline.category,
            color: timeline.color || 'bg-gray-500'
        });
        
        console.log('타임라인 등록 시도:', timeline);
        
        res.status(201).json({
            success: true,
            message: '타임라인이 성공적으로 등록되었습니다.'
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
            res.status(400).json({
                success: false,
                message: '삭제할 타임라인 ID가 제공되지 않았습니다.'
            });
            return;
        }
        
        // 데이터베이스에서 해당 ID의 타임라인 찾기
        const timeline = await TimeLine.findByPk(id);
        
        // 타임라인이 존재하지 않는 경우
        if (!timeline) {
            res.status(404).json({
                success: false,
                message: '해당 ID의 타임라인을 찾을 수 없습니다.'
            });
            return;
        }
        
        // 타임라인 삭제
        await timeline.destroy();
        
        // 성공 응답
        res.status(200).json({
            success: true,
            message: '타임라인이 성공적으로 삭제되었습니다.'
        });
    }
    catch(err)
    {
        return next(err)
    }
}