import { Router } from 'express';
import { getBlocks, postBlocks } from '../ctrl/blockCtrl';

const boardPath = {
    root : "/",
}
const router = Router();

router.get(``,getBlocks)
router.post(``,postBlocks)

export default router;