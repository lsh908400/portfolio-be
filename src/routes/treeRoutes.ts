import { Router } from 'express';
import { getPurpose, getTrees } from '../ctrl/treeCtrl';

const treePath = {
    root : "/",
    purpose : "/purpose",
}
const router = Router();

router.get(`${treePath.root}:type`,getTrees)
router.get(`${treePath.purpose}/:type`,getPurpose)

export default router;