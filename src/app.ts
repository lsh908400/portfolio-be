import config from './config/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

const dotenvFlow = require('dotenv-flow');
dotenvFlow.config();


import codeRoutes from './routes/codeRoutes';
import profileRoutes from './routes/profileRoutes';
import categoryRoutes from './routes/categoryRoutes';
import boardRoutes from './routes/boardRoutes';
import blockRoutes from './routes/blockRoutes';
import treeRoutes from './routes/treeRoutes';
import projectRoutes from './routes/projectRoutes';
import timelineRoutes from './routes/timelineRoutes';
import snipetRoutes from './routes/snippetRoutes';
import folderRoutes from './routes/folderRoutes';
import versionRoutes from './routes/versionRoutes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { initializeDatabases } from './config/database';
import { syncCategory } from './models/mysql/category';
import { Server, Server as SocketServer } from 'socket.io';

const api = '/api'
const path_config = {
    'code' : '/code',
    "user" : '/user',
    "category" : "/category",
    "board" : "/board",
    "blocks" : "/blocks",
    "tree" : "/tree",
    "project" : "/project",
    "timeline" : "/timeline",
    "snippet" : "/snippet",
    "folder" : "/folder",
    "version" : "/version",
}

initializeDatabases();
syncCategory();

const app = express();

app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
}, express.static(config.uploadPath));
app.use('/folders', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
}, express.static(config.basePath));

// API 라우트
app.use(`${api}${path_config.code}`, codeRoutes);
app.use(`${api}${path_config.user}`, profileRoutes);
app.use(`${api}${path_config.category}`, categoryRoutes);
app.use(`${api}${path_config.board}`, boardRoutes);
app.use(`${api}${path_config.blocks}`, blockRoutes);
app.use(`${api}${path_config.tree}`, treeRoutes);
app.use(`${api}${path_config.project}`, projectRoutes);
app.use(`${api}${path_config.timeline}`, timelineRoutes);
app.use(`${api}${path_config.snippet}`, snipetRoutes);
app.use(`${api}${path_config.folder}`, folderRoutes);
app.use(`${api}${path_config.version}`, versionRoutes);



app.use(errorHandler);

let server : any;
let io: SocketServer;

const downloadStates = new Map();
const downloadHistory = new Map();

const startServer = (): void => {
    try 
    {
        server = app.listen(config.port, () => {
            logger.info(`서버가 포트 ${config.port}에서 시작되었습니다. (환경: ${config.env}) CORS Origin : ${config.corsOrigin} ${path.join(__dirname, config.uploadPath)}` );
        });

        io = new Server(server, {
            cors: {
                origin: config.corsOrigin,
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            logger.info('Client connected:', socket.id);
            
            // 클라이언트가 다운로드 세션 시작을 요청
            socket.on('download:start', (sessionId) => {
                // 클라이언트를 특정 세션 룸에 조인
                socket.join(`download:${sessionId}`);
                logger.info(`Client ${socket.id} joined download session ${sessionId}`);
            });

            socket.on('download:request-status', (downloadId) => {
                logger.info(`클라이언트가 다운로드 상태 요청: ${downloadId}`);
                
                if (downloadStates.has(downloadId)) {
                  const state = downloadStates.get(downloadId);
                  
                  // 현재 상태 전송
                  socket.emit('download:status', state);
                  logger.info(`다운로드 상태 전송: ${downloadId}, 상태: ${state.status}`);
                  
                  // 다운로드가 이미 완료된 경우 히스토리 재생
                  if (state.isCompleted && downloadHistory.has(downloadId)) {
                    const events = downloadHistory.get(downloadId);
                    logger.info(`완료된 다운로드 히스토리 재생: ${downloadId}, 이벤트 수: ${events.length}`);
                    
                    // 중요 이벤트만 선택적으로 재생 (처음, 중간 진행, 마지막)
                    const keyEvents = [
                      events.find((e:any) => e.eventName === 'download:start'),
                      ...events.filter((e:any) => e.eventName === 'download:progress' && [25, 50, 75].includes(e.data.progress)),
                      events.find((e:any) => ['download:complete', 'download:error', 'download:canceled'].includes(e.eventName))
                    ].filter(Boolean);
                    
                    // 이벤트 재생 (지연을 두고 순차적으로)
                    let delay = 0;
                    keyEvents.forEach(event => {
                      setTimeout(() => {
                        socket.emit(event.eventName, {
                          ...event.data,
                          isReplay: true
                        });
                      }, delay);
                      delay += 200; // 각 이벤트 간 200ms 지연
                    });
                  }
                } else {
                  socket.emit('download:status', {
                    status: 'unknown',
                    message: '다운로드 정보를 찾을 수 없습니다',
                    downloadId
                  });
                }
            });
            
            socket.on('disconnect', () => {
                logger.info('Client disconnected:', socket.id);
            });
        });
    } 
    catch (error) 
    {
        logger.error('서버 시작 오류:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}




export {app,io, downloadStates, downloadHistory};