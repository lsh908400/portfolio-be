import { NextFunction, Request, Response } from "express";
import { deleteUserDirectory, formatFileSize, getUserDirectoryPath } from "../utils/fileHandler";
import * as fs from 'fs';
import Folder from "../models/mysql/folder";
import { randomUUID } from "crypto";
import path from 'path';

export const getFolder = async (req: Request, res: Response, next : NextFunction): Promise<void> => {
    try
    {
        const {id , dir} = req.query;
        if(!id || !dir) {
            res.status(400).json({
                success : false,
                message : '유저 아이디를 찾을 수 없습니다.'
            })
            return;
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

        const {folderPath,config} = getUserDirectoryPath(id.toString(),options);

        const items = await fs.promises.readdir(folderPath, { withFileTypes: true });

        const folderContentsPromises = await items.map(async (item) => {
            const itemPath = path.join(folderPath, item.name);
            const itemInfo = {
                name: item.name,
                isDirectory: item.isDirectory(),
                path: path.join(id.toString(), item.name),
                maxSizeBytes: 0,
                maxSizeFormatted: ''
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
            message : '폴더 데이터를 성공적으로 로드하였습니다.'
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
        console.log(postFolderForm)
        if(!postFolderForm)
        {
            res.status(400).json({
                success : false,
                message : '입렵 폼 에러'
            })
            return;
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
            res.status(400).json({
                success : false,
                message : '파일경로 에러'
            })
            return;
        }

        const options = {
            password : folder.pwd,
            maxSizeBytes : postFolderForm.maxSizeBytes
        }

        const newPath = path.join(postFolderForm.path, postFolderForm.name)
        const {folderPath,config} = getUserDirectoryPath(newPath.toString(),options);

        res.status(200).json({
            success : true,
            message : '폴더를 성공적으로 등록하였습니다.'
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
            res.status(400).json({
                success : false,
                message : '삭제 정보 에러'
            })
            return;
        }
        console.log(name,id)

        const newPath = path.join(id , name)
        
        const {success, message} = deleteUserDirectory(newPath);
        if(!success)
        {
            res.status(500).json({
                success : false,
                message : '폴더 삭제 중 서버에러'
            })
            return;
        }

        res.status(200).json({
            success : true,
            message : '폴더를 성공적으로 삭제하였습니다.'
        })
    }
    catch(err)
    {
        console.error(err)
        next(err)
    }
}