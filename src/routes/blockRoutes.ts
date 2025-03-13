import { Router } from 'express';
import { getBlocks } from '../ctrl/blockCtrl';

const boardPath = {
    root : "/",
}
const router = Router();

router.get(``,getBlocks)

export default router;