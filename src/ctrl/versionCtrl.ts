import { NextFunction, Request, Response } from "express";
import { VersionSchema } from "../models/mongo/version";
import mongoose from "mongoose";

const VersionModel = mongoose.model('Version', VersionSchema, 'versions');

export const getVersions  = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const version = await VersionModel.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            success : true,
            data : version
        })
    }
    catch(err)
    {
        console.error(err)
        return next(err);
    }
}