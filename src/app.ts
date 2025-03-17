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
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { initializeDatabases } from './config/database';
import { syncCategory } from './models/mysql/category';

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
  }, express.static(path.join(__dirname, '/uploads')));

// API 라우트
app.use(`${api}${path_config.code}`, codeRoutes);
app.use(`${api}${path_config.user}`, profileRoutes);
app.use(`${api}${path_config.category}`, categoryRoutes);
app.use(`${api}${path_config.board}`, boardRoutes);
app.use(`${api}${path_config.blocks}`, blockRoutes);
app.use(`${api}${path_config.tree}`, treeRoutes);
app.use(`${api}${path_config.project}`, projectRoutes);
app.use(`${api}${path_config.timeline}`, timelineRoutes);



app.use(errorHandler);
// app.use('/api', apiLimiter);
const startServer = (): void => {
    try 
    {
        app.listen(config.port, () => {
            logger.info(`서버가 포트 ${config.port}에서 시작되었습니다. (환경: ${config.env})`);
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




export default app;