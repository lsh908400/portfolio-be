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
const activeDownloadSessions = new Map();

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
            
            socket.on('download:start', (sessionId) => {
              socket.join(`download:${sessionId}`);
              
              // 룸 조인 후 룸 정보 출력
              const rooms = io.sockets.adapter.rooms;
              const room = rooms.get(`download:${sessionId}`);
              logger.info(`Client ${socket.id} joined download session ${sessionId}. Room size: ${room ? room.size : 0}`);
              
              // 테스트 메시지 전송
              socket.to(`download:${sessionId}`).emit('test:room', { message: 'Room join test' });
            });

            socket.on('download:request-status', (downloadId) => {
              logger.info(`클라이언트가 다운로드 상태 요청: ${downloadId}`);
              
              if (downloadStates.has(downloadId)) {
                const state = downloadStates.get(downloadId);
                
                socket.emit('download:status', state);
                logger.info(`다운로드 상태 전송: ${downloadId}, 상태: ${state.status}`);
                
                // 다운로드가 완료되었고 활성 세션이 아닌 경우에만 히스토리 재생
                if (state.isCompleted && !activeDownloadSessions.has(downloadId) && downloadHistory.has(downloadId)) {
                  const events = downloadHistory.get(downloadId);
                  logger.info(`완료된 다운로드 히스토리 재생: ${downloadId}, 이벤트 수: ${events.length}`);
                  
                  // 중요 이벤트만 선택 (시작, 25/50/75% 진행, 완료/에러/취소)
                  const keyEvents = [
                    events.find((e:any) => e.eventName === 'download:start'),
                    ...events.filter((e:any) => e.eventName === 'download:progress' && [25, 50, 75].includes(e.data.progress)),
                    events.find((e:any) => ['download:complete', 'download:error', 'download:canceled'].includes(e.eventName))
                  ].filter(Boolean);
                  
                  let delay = 0;
                  keyEvents.forEach(event => {
                    setTimeout(() => {
                      socket.emit(event.eventName, {
                        ...event.data,
                        isReplay: true  // 이벤트가 재생된 것임을 표시
                      });
                    }, delay);
                    delay += 100; // 각 이벤트 간 100ms 지연
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
            
            // 다운로드 완료 시 활성 세션 표시 제거
            socket.on('download:complete-received', (downloadId) => {
                if (activeDownloadSessions.has(downloadId)) {
                    activeDownloadSessions.delete(downloadId);
                    logger.info(`다운로드 세션 완료 확인: ${downloadId}`);
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




export {app,io, downloadStates, downloadHistory , activeDownloadSessions};