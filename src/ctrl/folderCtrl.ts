import { NextFunction, Request, Response } from "express";
import { calculateFolderSize, deleteUserDirectory, formatFileSize, getFolderSize, getUserDirectoryPath } from "../utils/fileHandler";
import * as fs from 'fs';
import Folder from "../models/mysql/folder";
import { randomUUID } from "crypto";
import path from 'path';
import { createBadRequestError, createNotFoundError, createServerError } from "../constants/errorMessages";
import { successMessage } from "../constants/successMessage";

export const getFolder = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {id , dir} = req.query;
        if(!id || !dir) {
            return next(createBadRequestError('folder'));
        }

        const folder = await Folder.findOne({
            where : {id : dir.toString()}
        })

        let options;
        if(!folder)
        {
            options = {
                password : randomUUID(),
                maxSizeBytes : 1073741824
            }

            const newFolder = await Folder.create({
                id : id.toString(),
                pwd : options.password,
                volume : options.maxSizeBytes
            })
        }
        else 
        {
            options = {
                password : folder.pwd,
                maxSizeBytes : folder.volume
            }
        }

        const {folderPath} = getUserDirectoryPath(id.toString(),options);

        const items = await fs.promises.readdir(folderPath, { withFileTypes: true });

        const folderContentsPromises = await items.map(async (item) => {
            const itemPath = path.join(folderPath, item.name);
            let currentSizeForm = '0MB';
            if(item.isDirectory())
            {
                const newPath = path.join(item.parentPath,item.name)
                const currentSize = calculateFolderSize(newPath);
                currentSizeForm = formatFileSize(currentSize)
            }
            
            const itemInfo = {
                name: item.name,
                isDirectory: item.isDirectory(),
                path: path.join(id.toString(), item.name),
                maxSizeBytes: 0,
                maxSizeFormatted: '',
                currentSizeFormatted : currentSizeForm,
            };
            
            if (item.isDirectory()) {
                const configPath = path.join(itemPath, '.folder-config.json');
                
                if (fs.existsSync(configPath)) {
                try {
                    const configData = await fs.promises.readFile(configPath, 'utf-8');
                    const folderConfig = JSON.parse(configData);
                    
                    itemInfo.maxSizeBytes = folderConfig.maxSizeBytes;
                    itemInfo.maxSizeFormatted = formatFileSize(folderConfig.maxSizeBytes);
                } catch (error) {
                    console.error(`설정 파일 읽기 오류: ${item.name}`, error);
                }
                }
            }
            
            return itemInfo;
        });
        const folderContents = await Promise.all(folderContentsPromises);
        res.status(200).json({
            success : true,
            data : folderContents,
            message : successMessage.folder.get
        })
    }
    catch(err)
    {
        console.error(err)
        next(err)
    }
}


export const postFolder = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const postFolderForm = req.body;
        if(!postFolderForm)
        {
            return next(createBadRequestError('folder'))
        }
        let id;

        if (postFolderForm.path && postFolderForm.path.includes('/')) {
            id = postFolderForm.path.split("/")[0]
        } else {
            id = postFolderForm.path;
        }

        const folder = await Folder.findOne({
            where : {id : id}
        })

        if(!folder)
        {
            return next(createNotFoundError('folder'))
        }

        if (!postFolderForm.maxSizeBytes || 
            typeof postFolderForm.maxSizeBytes !== 'number' || 
            postFolderForm.maxSizeBytes <= 0) {
            postFolderForm.maxSizeBytes = folder.volume; 
        }

        if (postFolderForm.maxSizeBytes > folder.volume) {
            postFolderForm.maxSizeBytes = folder.volume;
        }

        const options = {
            password : folder.pwd,
            maxSizeBytes : postFolderForm.maxSizeBytes
        }

        

        const newPath = path.join(postFolderForm.path, postFolderForm.name)
        const {folderPath,config} = getUserDirectoryPath(newPath.toString(),options);

        res.status(200).json({
            success : true,
            message : successMessage.folder.post
        })
    }
    catch(err)
    {
        console.error(err)
        next(err)
    }
}

export const deleteFolder = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {name , id} = req.body;
        if(!name || !id)
        {
            return next(createBadRequestError('folder'))
        }

        const newPath = path.join(id , name)
        
        const {success, message} = deleteUserDirectory(newPath);
        if(!success)
        {
            return next(createServerError('folder'));
        }

        res.status(200).json({
            success : true,
            message : successMessage.folder.delete
        })
    }
    catch(err)
    {
        console.error(err)
        next(err)
    }
}

export const uploadFolder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const files = req.files as Express.Multer.File[];
        
        const folderName = req.body.folderName;
        if (files && files.length > 0) {
            res.status(200).json({
                success: true,
                message: `${folderName} 폴더의 ${files.length}개 파일이 성공적으로 업로드되었습니다.`,
                files: files.map(file => file.path),
                fileCount: files.length
            });
        } else {
            res.status(400).json({
                success: false,
                message: successMessage.folder.noFile
            });
        }
    } catch (err) {
        console.error('파일 업로드 처리 중 오류:', err);
        next(err);
    }
};
