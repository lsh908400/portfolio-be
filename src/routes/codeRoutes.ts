import { Router } from 'express';

import {
    getPageCode,
    putPageCode,
} from '../ctrl/codeCtrl';

const router = Router();

router.get('/:pageName', getPageCode);
router.put('/:pageName', putPageCode);

export default router;