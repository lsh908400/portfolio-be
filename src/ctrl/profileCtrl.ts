import { Request, Response , NextFunction} from 'express';
import mongoose, { Schema } from 'mongoose';
import { IntroductionSchema, UserSchema } from '../models/user';
import { createBadRequestError, createNotFoundError } from '../constants/errorMessages';




const userModel = mongoose.model('User', UserSchema, 'user');
const introductionModel = mongoose.model('Introduction', IntroductionSchema, 'introduction' )

export const getUser = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        let user = await userModel.findOne({});
        if (!user) {
            return next(createNotFoundError('user', '등록된 사용자 정보가 필요합니다.'));
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        return next(error);
    }
};

export const getIntroduction = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        let introduction = await introductionModel.findOne({});
        if (!introduction) {
            return next(createNotFoundError('introduction'));
        }
        
        res.json({
            success: true,
            data: introduction
        });
    } catch (error) {
        return next(error)
    }
};

export const putMotivation = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const { motivation } = req.body;
        if (!motivation) {
            return next(createNotFoundError('introduction'));
        }
        const updatedIntroduction = await introductionModel.findOneAndUpdate(
            {}, 
            { 
              $set: { motivation }
            },
            { 
              new: true,
              runValidators: true
            }
        );

        if (!updatedIntroduction) {
            return next(createNotFoundError('introduction'));
        }
        
        res.json({
            success: true,
            data: '자기소개서 지원동기가 성공적으로 업데이트되었습니다.'
        });
    } catch (error) {
        return next(error)
    }
};

export const putGrowth = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const { growth } = req.body;
        if (!growth) {
            return next(createNotFoundError('introduction'));
        }
        const updatedIntroduction = await introductionModel.findOneAndUpdate(
            {}, 
            { 
              $set: { growth }
            },
            { 
              new: true,
              runValidators: true
            }
        );

        if (!updatedIntroduction) {
            return next(createNotFoundError('introduction'));
        }
        
        res.json({
            success: true,
            data: '자기소개서 지원동기가 성공적으로 업데이트되었습니다.'
        });
    } catch (error) {
        return next(error)
    }
};

export const putAdventage = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const { adventage } = req.body;
        if (!adventage) {
            return next(createNotFoundError('introduction'));
        }
        const updatedIntroduction = await introductionModel.findOneAndUpdate(
            {}, 
            { 
              $set: { adventage }
            },
            { 
              new: true,
              runValidators: true
            }
        );

        if (!updatedIntroduction) {
            return next(createNotFoundError('introduction'));
        }
        
        res.json({
            success: true,
            data: '자기소개서 지원동기가 성공적으로 업데이트되었습니다.'
        });
    } catch (error) {
        return next(error)
    }
};

export const putGoals = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const { goals } = req.body;
        if (!goals) {
            return next(createNotFoundError('introduction'));
        }
        const updatedIntroduction = await introductionModel.findOneAndUpdate(
            {}, 
            { 
              $set: { goals }
            },
            { 
              new: true,
              runValidators: true
            }
        );

        if (!updatedIntroduction) {
            return next(createNotFoundError('introduction'));
        }
        
        res.json({
            success: true,
            data: '자기소개서 지원동기가 성공적으로 업데이트되었습니다.'
        });
    } catch (error) {
        return next(error)
    }
};