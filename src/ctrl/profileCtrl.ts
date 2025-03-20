import { Request, Response , NextFunction} from 'express';
import mongoose, { Schema } from 'mongoose';
import { IntroductionSchema, UserSchema } from '../models/mongo/user';
import { createBadRequestError, createNotFoundError, updateError } from '../constants/errorMessages';
import { successMessage } from '../constants/successMessage';




const userModel = mongoose.model('User', UserSchema, 'user');
const introductionModel = mongoose.model('Introduction', IntroductionSchema, 'introduction' )

export const getUser = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        let user = await userModel.findOne({});
        if (!user) {
            return next(createBadRequestError('user', '등록된 사용자 정보가 필요합니다.'));
        }

        res.status(200).json({
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
        
        res.status(200).json({
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
            return next(createBadRequestError('introduction'));
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
        
        res.status(200).json({
            success: true,
            message: successMessage.profile.motivation
        });
    } catch (error) {
        return next(error)
    }
};

export const putGrowth = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const { growth } = req.body;
        if (!growth) {
            return next(createBadRequestError('introduction'));
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
        
        res.status(200).json({
            success: true,
            message: successMessage.profile.growth
        });
    } catch (error) {
        return next(error)
    }
};

export const putAdventage = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const { adventage } = req.body;
        if (!adventage) {
            return next(createBadRequestError('introduction'));
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
        
        res.status(200).json({
            success: true,
            message: successMessage.profile.adventage
        });
    } catch (error) {
        return next(error)
    }
};

export const putGoals = async (req: Request, res: Response, next : NextFunction): Promise<void> => {

    try {
        const { goals } = req.body;
        if (!goals) {
            return next(createBadRequestError('introduction'));
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
        
        res.status(200).json({
            success: true,
            message: successMessage.profile.goals
        });
    } catch (error) {
        return next(error)
    }
};